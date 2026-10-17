import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

// GET /api/settings
export async function GET(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  let settings = await prisma.companySettings.findFirst();
  if (!settings) {
    // Create default settings
    settings = await prisma.companySettings.create({
      data: {
        name: "Seyon UPVC",
        quotationPrefix: "QT",
        quotationNextNumber: 1,
        quotationValidity: 30,
        invoicePrefix: "INV",
        invoiceNextNumber: 1,
      },
    });
  }
  return createApiSuccess({ settings });
}

// PUT /api/settings
export async function PUT(request: NextRequest) {
  const { error } = await requireAuth(request);
  if (error) return error;

  try {
    const body = await request.json();
    const {
      name, logo, address, city, state, pincode, phone, email, website, gstin, pan,
      bankName, bankAccount, bankIFSC, bankBranch,
      quotationPrefix, quotationValidity, quotationTerms, quotationSignature,
      invoicePrefix, invoiceTerms, invoiceSignature,
      placeOfSupply, stateCode,
    } = body;

    let settings = await prisma.companySettings.findFirst();
    if (settings) {
      settings = await prisma.companySettings.update({
        where: { id: settings.id },
        data: {
          ...(name !== undefined && { name }),
          ...(logo !== undefined && { logo }),
          ...(address !== undefined && { address }),
          ...(city !== undefined && { city }),
          ...(state !== undefined && { state }),
          ...(pincode !== undefined && { pincode }),
          ...(phone !== undefined && { phone }),
          ...(email !== undefined && { email }),
          ...(website !== undefined && { website }),
          ...(gstin !== undefined && { gstin }),
          ...(pan !== undefined && { pan }),
          ...(bankName !== undefined && { bankName }),
          ...(bankAccount !== undefined && { bankAccount }),
          ...(bankIFSC !== undefined && { bankIFSC }),
          ...(bankBranch !== undefined && { bankBranch }),
          ...(quotationPrefix !== undefined && { quotationPrefix: quotationPrefix.trim().replace(/[\s-]+$/, "") }),
          ...(quotationValidity !== undefined && { quotationValidity: parseInt(quotationValidity) }),
          ...(quotationTerms !== undefined && { quotationTerms }),
          ...(quotationSignature !== undefined && { quotationSignature }),
          ...(invoicePrefix !== undefined && { invoicePrefix: invoicePrefix.trim().replace(/[\s-]+$/, "") }),
          ...(invoiceTerms !== undefined && { invoiceTerms }),
          ...(invoiceSignature !== undefined && { invoiceSignature }),
          ...(placeOfSupply !== undefined && { placeOfSupply }),
          ...(stateCode !== undefined && { stateCode }),
        },
      });
    } else {
      settings = await prisma.companySettings.create({ data: body });
    }
    return createApiSuccess({ settings });
  } catch (err) {
    console.error("Settings update error:", err);
    return createApiError("Failed to update settings.", 500);
  }
}
