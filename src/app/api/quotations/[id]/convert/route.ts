import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";
import { calculateLineItem, calculateTotals } from "@/lib/calculations";

// POST /api/quotations/[id]/convert — Convert quotation to bill
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  try {
    // SECURITY: only fetch quotation from own counter
    const quotation = await prisma.quotation.findFirst({
      where: { id, counterId: session.counterId },
      include: { items: { orderBy: { sortOrder: "asc" } } },
    });

    if (!quotation) return createApiError("Quotation not found.", 404);
    if (quotation.status === "CONVERTED") {
      return createApiError("This quotation has already been converted to a bill.");
    }
    if (quotation.status === "CANCELLED") {
      return createApiError("Cannot convert a cancelled quotation.");
    }

    // Check if already converted
    const existingBill = await prisma.bill.findFirst({
      where: { convertedFromQuotationId: quotation.id },
    });
    if (existingBill) {
      return createApiError(`Already converted to bill: ${existingBill.invoiceNumber}`);
    }

    // Generate invoice number
    const settings = await prisma.companySettings.findFirst();
    const prefix = (settings?.invoicePrefix || "INV").replace(/[\s-]+$/, "");
    const nextNum = settings?.invoiceNextNumber || 1;
    const invoiceNumber = `${prefix}-${String(nextNum).padStart(6, "0")}`;

    // Increment counter atomically
    if (settings) {
      await prisma.companySettings.update({
        where: { id: settings.id },
        data: { invoiceNextNumber: { increment: 1 } },
      });
    }

    // Recalculate from saved snapshot prices (never re-fetch product prices)
    const calculatedItems = quotation.items.map((item) => ({
      ...item,
      ...calculateLineItem({
        quantity: parseFloat(item.quantity.toString()),
        rate: parseFloat(item.rate.toString()),
        mrp: parseFloat(item.mrp.toString()),
        gstPercent: parseFloat(item.gstPercent.toString()),
        discountPercent: parseFloat(item.discountPercent.toString()),
        isInterState: parseFloat(item.igstAmount.toString()) > 0,
      }),
    }));
    const totals = calculateTotals(calculatedItems);

    // Create bill and update quotation status atomically
    const [bill] = await prisma.$transaction([
      prisma.bill.create({
        data: {
          invoiceNumber,
          customerId: quotation.customerId,
          customerSnapshot: quotation.customerSnapshot as any,
          counterId: session.counterId,
          createdById: session.userId,
          convertedFromQuotationId: quotation.id,
          salesPerson: quotation.salesPerson,
          placeOfSupply: quotation.placeOfSupply,
          status: "PAID",
          amountPaid: totals.grandTotal,
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxableAmount: totals.taxableAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          grandTotal: totals.grandTotal,
          items: {
            create: quotation.items.map((item, idx) => ({
              productId: item.productId,
              productName: item.productName,
              productCode: item.productCode,
              hsnSac: item.hsnSac,
              unit: item.unit,
              mrp: item.mrp,
              rate: item.rate,
              gstPercent: item.gstPercent,
              quantity: item.quantity,
              discountPercent: item.discountPercent,
              discountAmount: item.discountAmount,
              taxableAmount: item.taxableAmount,
              gstAmount: item.gstAmount,
              cgstAmount: item.cgstAmount,
              sgstAmount: item.sgstAmount,
              igstAmount: item.igstAmount,
              amount: item.amount,
              sortOrder: idx,
            })),
          },
        },
        include: { items: true, customer: true },
      }),
      prisma.quotation.update({
        where: { id: quotation.id },
        data: { status: "CONVERTED" },
      }),
    ]);

    return createApiSuccess({ bill, quotation: bill }, 201);
  } catch (err) {
    console.error("Convert quotation error:", err);
    return createApiError("Failed to convert quotation to bill.", 500);
  }
}
