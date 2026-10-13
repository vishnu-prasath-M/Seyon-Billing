import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const bill = await prisma.bill.findFirst({
    where: {
      id,
      counterId: session.counterId, // SECURITY: counter-isolated
    },
    include: {
      items: { orderBy: { sortOrder: "asc" } },
      customer: true,
      createdBy: { select: { name: true } },
      counter: { select: { name: true } },
      convertedFromQuotation: { select: { id: true, quotationNumber: true } },
    },
  });

  if (!bill) return createApiError("Bill not found.", 404);
  return createApiSuccess({ bill });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  try {
    const body = await request.json();
    const { status, amountPaid } = body;

    const bill = await prisma.bill.findFirst({
      where: { id, counterId: session.counterId },
    });
    if (!bill) return createApiError("Bill not found.", 404);

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(amountPaid !== undefined && { amountPaid: parseFloat(amountPaid) }),
      },
    });

    return createApiSuccess({ bill: updated });
  } catch {
    return createApiError("Failed to update bill.", 500);
  }
}
