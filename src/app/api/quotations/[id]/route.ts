import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

// GET /api/quotations/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const quotation = await prisma.quotation.findFirst({
    where: {
      id,
      counterId: session.counterId, // SECURITY: only own counter
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      createdBy: { select: { name: true } },
      counter: { select: { name: true } },
      convertedToBill: { select: { id: true, invoiceNumber: true } },
    },
  });

  if (!quotation) return createApiError("Quotation not found.", 404);
  return createApiSuccess({ quotation });
}

// PATCH /api/quotations/[id] — update status
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  try {
    const body = await request.json();
    const { status } = body;

    const quotation = await prisma.quotation.findFirst({
      where: { id, counterId: session.counterId },
    });
    if (!quotation) return createApiError("Quotation not found.", 404);

    const updated = await prisma.quotation.update({
      where: { id },
      data: { status },
    });

    return createApiSuccess({ quotation: updated });
  } catch {
    return createApiError("Failed to update quotation.", 500);
  }
}
