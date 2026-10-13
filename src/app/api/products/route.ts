import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

// GET /api/products — list products (shared, all counters)
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || "";
  const isActive = searchParams.get("isActive");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { code: { contains: search, mode: "insensitive" } },
      { hsnSac: { contains: search, mode: "insensitive" } },
    ];
  }
  if (categoryId) where.categoryId = categoryId;
  if (isActive !== null && isActive !== "") {
    where.isActive = isActive === "true";
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      skip,
      take: limit,
    }),
    prisma.product.count({ where }),
  ]);

  return createApiSuccess({ products, total, page, limit });
}

// POST /api/products — create product
export async function POST(request: NextRequest) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name, code, categoryId, hsnSac, unit, mrp, sellingPrice, gstPercent, stock, trackStock, description, isActive } = body;

    if (!name || !code || mrp === undefined || sellingPrice === undefined) {
      return createApiError("Name, code, MRP, and selling price are required.");
    }

    // Check duplicate code
    const existing = await prisma.product.findUnique({ where: { code } });
    if (existing) {
      return createApiError(`Product code "${code}" already exists.`);
    }

    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        categoryId: categoryId || null,
        hsnSac: hsnSac?.trim() || null,
        unit: unit || "Nos",
        mrp: parseFloat(mrp),
        sellingPrice: parseFloat(sellingPrice),
        gstPercent: parseFloat(gstPercent || "18"),
        stock: stock ? parseInt(stock) : null,
        trackStock: trackStock || false,
        description: description?.trim() || null,
        isActive: isActive !== false,
      },
      include: { category: true },
    });

    return createApiSuccess({ product }, 201);
  } catch (err) {
    console.error("Create product error:", err);
    return createApiError("Failed to create product.", 500);
  }
}
