"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { LoadingState } from "@/components/ui";

interface DashboardData {
  todayQuotations: number;
  todayBills: number;
  todaySales: number | string;
  totalProducts: number;
  recentQuotations: Array<{
    id: string;
    quotationNumber: string;
    createdAt: string;
    grandTotal: number | string;
    status: string;
    customerSnapshot: { name?: string };
  }>;
  recentBills: Array<{
    id: string;
    invoiceNumber: string;
    invoiceDate: string;
    grandTotal: number | string;
    status: string;
    customerSnapshot: { name?: string };
  }>;
}

function formatINR(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(num || 0);
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((d) => setData(d))
      .finally(() => setLoading(false));
  }, []);

    // Data is loaded asynchronously in background

  const stats = [
    {
      label: "Today's Quotations",
      value: data?.todayQuotations ?? 0,
      sub: "Active estimates generated today",
      link: "/quotations",
      badgeColor: "bg-blue-50 text-blue-700 border-blue-200",
      accent: "#087ea4",
    },
    {
      label: "Today's Bills",
      value: data?.todayBills ?? 0,
      sub: "Generated tax invoices",
      link: "/billing",
      badgeColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
      accent: "#059669",
    },
    {
      label: "Today's Sales Revenue",
      value: formatINR(data?.todaySales ?? 0),
      sub: "Billed total from invoices",
      link: "/history",
      badgeColor: "bg-amber-50 text-amber-700 border-amber-200",
      accent: "#d97706",
    },
    {
      label: "Catalog Products",
      value: data?.totalProducts ?? 0,
      sub: "Shared UPVC profile master",
      link: "/products",
      badgeColor: "bg-indigo-50 text-indigo-700 border-indigo-200",
      accent: "#4f46e5",
    },
  ];

  return (
    <div className="space-y-6 md:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-4">
          <img
            src="/seyon-logo.png"
            alt="Seyon UPVC Logo"
            className="h-12 w-12 object-contain drop-shadow-xs"
          />
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Workstation Dashboard
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Seyon UPVC Windows & Doors • Billing & Estimation Control Center
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/quotations/new"
            className="px-4 py-2 text-xs font-bold bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 shadow-2xs transition-all hover:border-slate-400"
          >
            + New Quotation
          </Link>
          <Link
            href="/billing/new"
            className="px-5 py-2 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] shadow-sm transition-all"
          >
            + Create Bill
          </Link>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
        {stats.map((s) => (
          <Link
            key={s.label}
            href={s.link}
            className="bg-white p-6 rounded-xl border border-slate-200/90 shadow-xs hover:border-[#087ea4] hover:shadow-md transition-all no-underline block group"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                {s.label}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${s.badgeColor}`}>
                Active
              </span>
            </div>
            <div className="text-2xl md:text-3xl font-black text-slate-900 mt-3 tracking-tight group-hover:text-[#087ea4] transition-colors">
              {s.value}
            </div>
            <div className="text-xs text-slate-400 mt-1.5 font-medium">{s.sub}</div>
          </Link>
        ))}
      </div>

      {/* Recent Activity Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotations */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Quotations
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Estimates and proposals</p>
            </div>
            <Link
              href="/quotations"
              className="text-xs font-bold text-[#087ea4] hover:underline"
            >
              View all →
            </Link>
          </div>

          {!data?.recentQuotations?.length ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No quotations created on this workstation yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Number</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentQuotations.map((q) => (
                    <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="font-mono font-bold text-[#087ea4] hover:underline"
                        >
                          {q.quotationNumber}
                        </Link>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          {formatDate(q.createdAt)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {q.customerSnapshot?.name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(q.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            q.status === "CONVERTED"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : q.status === "ACCEPTED"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : q.status === "SENT"
                              ? "bg-blue-50 text-blue-700 border-blue-200"
                              : "bg-slate-100 text-slate-700 border-slate-200"
                          }`}
                        >
                          {q.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Bills */}
        <div className="bg-white rounded-xl border border-slate-200/90 shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
            <div>
              <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Recent Invoices
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">Tax invoices and billing transactions</p>
            </div>
            <Link
              href="/billing"
              className="text-xs font-bold text-[#087ea4] hover:underline"
            >
              View all →
            </Link>
          </div>

          {!data?.recentBills?.length ? (
            <div className="p-10 text-center text-xs text-slate-400">
              No bills generated on this workstation yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50/80 text-slate-600 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Invoice</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.recentBills.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-4">
                        <Link
                          href={`/bills/${b.id}`}
                          className="font-mono font-bold text-[#087ea4] hover:underline"
                        >
                          {b.invoiceNumber}
                        </Link>
                        <div className="text-[10.5px] text-slate-400 mt-0.5">
                          {formatDate(b.invoiceDate)}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        {b.customerSnapshot?.name || "—"}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900">
                        {formatINR(b.grandTotal)}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full border ${
                            b.status === "PAID"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : b.status === "PARTIAL"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions Footer Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-6 shadow-xs">
        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
          Quick Access & Workstation Shortcuts
        </h3>
        <div className="flex flex-wrap gap-3 text-xs">
          <Link
            href="/quotations/new"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors shadow-2xs"
          >
            + Create Quotation
          </Link>
          <Link
            href="/billing/new"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors shadow-2xs"
          >
            + Create Bill / Invoice
          </Link>
          <Link
            href="/products/new"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors shadow-2xs"
          >
            + Add UPVC Profile / Product
          </Link>
          <Link
            href="/bills"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors shadow-2xs"
          >
            View All Bills & Invoices
          </Link>
          <Link
            href="/history"
            className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-100 font-semibold transition-colors shadow-2xs"
          >
            View Workstation History
          </Link>
        </div>
      </div>
    </div>
  );
}
