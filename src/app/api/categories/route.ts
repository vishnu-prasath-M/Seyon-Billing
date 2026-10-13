import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

// GET /api/categories
export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { products: true } } },
  });
  return createApiSuccess({ categories });
}

// POST /api/categories
export async function POST(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { name } = body;
    if (!name) return createApiError("Category name is required.");

    const existing = await prisma.category.findUnique({ where: { name: name.trim() } });
    if (existing) return createApiError("Category already exists.");

    const category = await prisma.category.create({ data: { name: name.trim() } });
    return createApiSuccess({ category }, 201);
  } catch {
    return createApiError("Failed to create category.", 500);
  }
}
