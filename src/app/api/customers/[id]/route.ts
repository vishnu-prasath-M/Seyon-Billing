import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  const customer = await prisma.customer.findUnique({ where: { id } });
  if (!customer) return createApiError("Customer not found.", 404);
  return createApiSuccess({ customer });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { error } = await requireAuth(request);
  if (error) return error;

  const { id } = await params;
  try {
    const body = await request.json();
    const { name, phone, email, address, city, state, pincode, gstin, placeOfSupply, isActive } = body;

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...(name && { name: name.trim() }),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
        address: address?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim() || null,
        pincode: pincode?.trim() || null,
        gstin: gstin?.trim() || null,
        placeOfSupply: placeOfSupply?.trim() || null,
        ...(isActive !== undefined && { isActive }),
      },
    });

    return createApiSuccess({ customer });
  } catch {
    return createApiError("Failed to update customer.", 500);
  }
}
