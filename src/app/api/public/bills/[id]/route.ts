import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;

    const bill = await prisma.bill.findUnique({
      where: { id },
      include: {
        items: {
          orderBy: { sortOrder: "asc" },
        },
        counter: true,
        createdBy: {
          select: { name: true },
        },
      },
    });

    if (!bill) {
      return NextResponse.json({ error: "Bill not found" }, { status: 404 });
    }

    const settings = await prisma.companySettings.findFirst();

    return NextResponse.json({ bill, settings });
  } catch (error) {
    console.error("Public bill fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch bill" }, { status: 500 });
  }
}
