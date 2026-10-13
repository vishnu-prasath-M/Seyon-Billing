import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth, createApiError, createApiSuccess } from "@/lib/api-helpers";

// GET /api/dashboard — counter-specific stats
export async function GET(request: NextRequest) {
  const { session, error } = await requireAuth(request);
  if (error) return error;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date();
  todayEnd.setHours(23, 59, 59, 999);

  const counterId = session.counterId;

  const [
    todayQuotations,
    todayBills,
    todaySalesAgg,
    totalProducts,
    recentQuotations,
    recentBills,
  ] = await Promise.all([
    prisma.quotation.count({
      where: { counterId, createdAt: { gte: today, lte: todayEnd } },
    }),
    prisma.bill.count({
      where: { counterId, invoiceDate: { gte: today, lte: todayEnd } },
    }),
    prisma.bill.aggregate({
      where: {
        counterId,
        invoiceDate: { gte: today, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
      _sum: { grandTotal: true },
    }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.quotation.findMany({
      where: { counterId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    prisma.bill.findMany({
      where: { counterId },
      include: { customer: true },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ]);

  return createApiSuccess({
    todayQuotations,
    todayBills,
    todaySales: todaySalesAgg._sum.grandTotal || 0,
    totalProducts,
    recentQuotations,
    recentBills,
  });
}
