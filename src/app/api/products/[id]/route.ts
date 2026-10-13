import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

// GET /api/products/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { category: true },
  });

  if (!product) return createApiError("Product not found.", 404);
  return createApiSuccess({ product });
}

// PUT /api/products/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  try {
    const body = await request.json();
    const { name, code, categoryId, hsnSac, unit, mrp, sellingPrice, gstPercent, stock, trackStock, description, isActive } = body;

    // Check if code is taken by another product
    if (code) {
      const existing = await prisma.product.findFirst({
        where: { code, NOT: { id } },
      });
      if (existing) return createApiError(`Product code "${code}" already exists.`);
    }

    const product = await prisma.product.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        ...(code && { code: code.trim().toUpperCase() }),
        categoryId: categoryId || null,
        ...(hsnSac !== undefined && { hsnSac: hsnSac?.trim() || null }),
        ...(unit && { unit }),
        ...(mrp !== undefined && { mrp: parseFloat(mrp) }),
        ...(sellingPrice !== undefined && { sellingPrice: parseFloat(sellingPrice) }),
        ...(gstPercent !== undefined && { gstPercent: parseFloat(gstPercent) }),
        ...(stock !== undefined && { stock: stock ? parseInt(stock) : null }),
        ...(trackStock !== undefined && { trackStock }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
      },
      include: { category: true },
    });

    return createApiSuccess({ product });
  } catch (err) {
    console.error("Update product error:", err);
    return createApiError("Failed to update product.", 500);
  }
}

// DELETE /api/products/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  try {
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });
    return createApiSuccess({ message: "Product deactivated." });
  } catch {
    return createApiError("Failed to deactivate product.", 500);
  }
}
