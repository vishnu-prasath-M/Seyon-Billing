import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  try {
    const settings = await prisma.companySettings.findFirst();
    const prefix = (settings?.quotationPrefix || "QT").replace(/[\s-]+$/, "");
    const nextNum = settings?.quotationNextNumber || 1;
    const nextNumber = `${prefix}-${String(nextNum).padStart(6, "0")}`;

    return NextResponse.json({ nextNumber });
  } catch (err) {
    return NextResponse.json({ nextNumber: "QT-000001" });
  }
}
