"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/calculations";
import { LoadingState, EmptyState, Toast, useToast } from "@/components/ui";

export default function BillsListPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const [bills, setBills] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const loadBills = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (paymentStatusFilter !== "ALL") params.set("paymentStatus", paymentStatusFilter);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/bills?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setBills(data.bills || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch {
      showToast("Error loading bills", "error");
    } finally {
      setLoading(false);
    }
  }, [search, paymentStatusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadBills();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadBills]);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Tax Invoices & Billing</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage tax invoices, print GST receipts, and record client payment status
          </p>
        </div>

        <Link
          href="/bills/new"
          className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] transition-all shadow-sm"
        >
          + New Bill / Invoice
        </Link>
      </div>

      {/* Search & Status Filter */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search by Invoice No, Customer Name or Phone..."
            className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] bg-white shadow-2xs"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 text-xs"
            >
              ✕
            </button>
          )}
        </div>

        <div className="w-full sm:w-56">
          <select
            value={paymentStatusFilter}
            onChange={(e) => {
              setPaymentStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] bg-white text-slate-800 shadow-2xs cursor-pointer font-medium"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading invoices..." />
      ) : bills.length === 0 ? (
        <EmptyState
          title="No bills found"
          description={
            search || paymentStatusFilter !== "ALL"
              ? "Try adjusting your search query or filter."
              : "No bills have been created on this counter yet."
          }
          actionLabel="+ Create First Bill"
          onAction={() => router.push("/bills/new")}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Invoice No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Mode</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-right">Balance</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bills.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#087ea4]">
                      <Link href={`/bills/${b.id}`} className="hover:underline">
                        {b.invoiceNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{b.customerName}</div>
                      {b.customerPhone && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {b.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(b.invoiceDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-mono text-[11.5px]">
                      {b.paymentMode}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-[12.5px]">
                      {formatCurrency(Number(b.grandTotal))}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-600">
                      {Number(b.balanceAmount) > 0 ? (
                        <span className="text-amber-700 font-bold">
                          {formatCurrency(Number(b.balanceAmount))}
                        </span>
                      ) : (
                        "₹0"
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          b.paymentStatus === "PAID"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : b.paymentStatus === "PARTIAL"
                            ? "bg-amber-50 text-amber-700 border-amber-200"
                            : "bg-rose-50 text-rose-700 border-rose-200"
                        }`}
                      >
                        {b.paymentStatus}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/bills/${b.id}`}
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                      >
                        View & Print
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium">
            <span>
              Showing {bills.length} of {totalCount} bills
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-md bg-white disabled:opacity-40 cursor-pointer font-semibold shadow-2xs hover:bg-slate-50"
              >
                Prev
              </button>
              <span className="px-2 text-slate-700 font-semibold">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1.5 border border-slate-300 rounded-md bg-white disabled:opacity-40 cursor-pointer font-semibold shadow-2xs hover:bg-slate-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
