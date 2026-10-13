import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";
import { calculateLineItem, calculateTotals } from "@/lib/calculations";

// GET /api/quotations — counter-filtered
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

  // CRITICAL: always filter by the session's counterId — never trust frontend
  const where: Record<string, unknown> = {
    counterId: session.counterId,
  };

  if (search) {
    where.OR = [
      { quotationNumber: { contains: search, mode: "insensitive" } },
      { customerSnapshot: { path: ["name"], string_contains: search } },
    ];
  }
  if (status) where.status = status;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      (where.createdAt as Record<string, unknown>).lte = toDate;
    }
  }

  const [quotations, total] = await Promise.all([
    prisma.quotation.findMany({
      where,
      include: {
        customer: true,
        items: { orderBy: { sortOrder: "asc" } },
        createdBy: { select: { name: true } },
        counter: { select: { name: true } },
        convertedToBill: { select: { invoiceNumber: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.quotation.count({ where }),
  ]);

  return createApiSuccess({ quotations, total, page, limit });
}

// POST /api/quotations — create quotation
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
      shipTo,
      expiryDate,
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

    // Generate unique quotation number
    const settings = await prisma.companySettings.findFirst();
    const prefix = settings?.quotationPrefix || "QT";
    const nextNum = settings?.quotationNextNumber || 1;
    const quotationNumber = `${prefix}-${String(nextNum).padStart(6, "0")}`;

    // Increment counter atomically
    if (settings) {
      await prisma.companySettings.update({
        where: { id: settings.id },
        data: { quotationNextNumber: { increment: 1 } },
      });
    }

    const quotation = await prisma.quotation.create({
      data: {
        quotationNumber,
        customerId: customerId || null,
        customerSnapshot: customerSnapshot || {},
        counterId: session.counterId, // Always from session — never from frontend
        createdById: session.userId,
        salesPerson: salesPerson?.trim() || null,
        placeOfSupply: placeOfSupply?.trim() || null,
        shipTo: shipTo?.trim() || null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
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

    return createApiSuccess({ quotation }, 201);
  } catch (err) {
    console.error("Create quotation error:", err);
    return createApiError("Failed to create quotation.", 500);
  }
}
