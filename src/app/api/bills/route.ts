import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";
import { calculateLineItem, calculateTotals } from "@/lib/calculations";

// GET /api/bills
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "";
  const from = searchParams.get("from") || "";
  const to = searchParams.get("to") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const skip = (page - 1) * limit;

  // CRITICAL: always filter by session's counterId
  const where: Record<string, unknown> = {
    counterId: session.counterId,
  };

  if (search) {
    where.OR = [
      { invoiceNumber: { contains: search, mode: "insensitive" } },
      { customerSnapshot: { path: ["name"], string_contains: search } },
    ];
  }
  if (status) where.status = status;
  if (from || to) {
    where.invoiceDate = {};
    if (from) (where.invoiceDate as Record<string, unknown>).gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (where.invoiceDate as Record<string, unknown>).lte = toDate;
    }
  }

  const [bills, total] = await Promise.all([
    prisma.bill.findMany({
      where,
      include: {
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
        createdBy: { select: { name: true } },
        counter: { select: { name: true } },
        convertedFromQuotation: { select: { quotationNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.bill.count({ where }),
  ]);

  return createApiSuccess({ bills, total, page, limit });
}

// POST /api/bills
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      customerId,
      customerSnapshot,
      salesPerson,
      placeOfSupply,
      invoiceDate,
      items,
      notes,
      isInterState,
    } = body;

    if (!items || items.length === 0) {
      return createApiError("At least one item is required.");
    }

    // Calculate items
    const calculatedItems = items.map((item: {
      quantity: number;
      rate: number;
      mrp: number;
      gstPercent: number;
      discountPercent?: number;
    }, idx: number) => ({
      ...item,
      ...calculateLineItem({
        quantity: parseFloat(item.quantity.toString()),
        rate: parseFloat(item.rate.toString()),
        mrp: parseFloat(item.mrp.toString()),
        gstPercent: parseFloat(item.gstPercent.toString()),
        discountPercent: parseFloat((item.discountPercent || 0).toString()),
        isInterState: isInterState || false,
      }),
      sortOrder: idx,
    }));

    const totals = calculateTotals(calculatedItems);

    // Generate invoice number
    const settings = await prisma.companySettings.findFirst();
    const prefix = settings?.invoicePrefix || "INV";
    const cleanPrefix = prefix.replace(/[\s-]+$/, "");
    const nextNum = settings?.invoiceNextNumber || 1;
    const invoiceNumber = `${cleanPrefix}-${String(nextNum).padStart(6, "0")}`;

    if (settings) {
      await prisma.companySettings.update({
        where: { id: settings.id },
        data: { invoiceNextNumber: { increment: 1 } },
      });
    }

    const bill = await prisma.bill.create({
      data: {
        invoiceNumber,
        customerId: customerId || null,
        customerSnapshot: customerSnapshot || {},
        counterId: session.counterId, // Always from session
        createdById: session.userId,
        salesPerson: salesPerson?.trim() || null,
        placeOfSupply: placeOfSupply?.trim() || null,
        invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
        notes: notes?.trim() || null,
        subtotal: totals.subtotal,
        discountAmount: totals.discountAmount,
        taxableAmount: totals.taxableAmount,
        cgstAmount: totals.cgstAmount,
        sgstAmount: totals.sgstAmount,
        igstAmount: totals.igstAmount,
        grandTotal: totals.grandTotal,
        items: {
          create: calculatedItems.map((item: {
            productId?: string;
            productName: string;
            productCode: string;
            hsnSac?: string;
            unit: string;
            mrp: number;
            rate: number;
            gstPercent: number;
            quantity: number;
            discountPercent: number;
            discountAmount: number;
            taxableAmount: number;
            gstAmount: number;
            cgstAmount: number;
            sgstAmount: number;
            igstAmount: number;
            amount: number;
            sortOrder: number;
          }) => ({
            productId: item.productId || null,
            productName: item.productName,
            productCode: item.productCode,
            hsnSac: item.hsnSac || null,
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
            sortOrder: item.sortOrder,
          })),
        },
      },
      include: {
        items: { orderBy: { sortOrder: "asc" } },
        customer: true,
        createdBy: { select: { name: true } },
        counter: { select: { name: true } },
      },
    });

    return createApiSuccess({ bill }, 201);
  } catch (err) {
    console.error("Create bill error:", err);
    return createApiError("Failed to create bill.", 500);
  }
}
