"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/calculations";
import { LoadingState, EmptyState, Toast, useToast, ConfirmDialog } from "@/components/ui";

export default function QuotationsListPage() {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const [quotations, setQuotations] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  const [convertTargetId, setConvertTargetId] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);

  const loadQuotations = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      params.set("page", page.toString());
      params.set("limit", "15");

      const res = await fetch(`/api/quotations?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setQuotations(data.quotations || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch {
      showToast("Error loading quotations", "error");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, page]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadQuotations();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadQuotations]);

  const handleConvert = async () => {
    if (!convertTargetId) return;
    setIsConverting(true);
    try {
      const res = await fetch(`/api/quotations/${convertTargetId}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to convert", "error");
        setIsConverting(false);
        setConvertTargetId(null);
        return;
      }
      showToast("Converted to Bill successfully!", "success");
      setConvertTargetId(null);
      setIsConverting(false);
      router.push(`/bills/${data.bill.id}`);
    } catch {
      showToast("Conversion failed due to network error", "error");
      setIsConverting(false);
      setConvertTargetId(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Quotations Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage quotations, print client proposals, and convert estimates into tax invoices
          </p>
        </div>

        <Link
          href="/quotations/new"
          className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] transition-all shadow-sm"
        >
          + New Quotation
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
            placeholder="Search by Quotation No, Customer Name or Phone..."
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
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] bg-white text-slate-800 shadow-2xs cursor-pointer font-medium"
          >
            <option value="ALL">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SENT">Sent</option>
            <option value="ACCEPTED">Accepted</option>
            <option value="CONVERTED">Converted to Bill</option>
            <option value="EXPIRED">Expired</option>
            <option value="REJECTED">Rejected</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading quotations..." />
      ) : quotations.length === 0 ? (
        <EmptyState
          title="No quotations found"
          description={
            search || statusFilter !== "ALL"
              ? "Try adjusting your search query or filter."
              : "No quotations have been created on this counter yet."
          }
          actionLabel="+ Create First Quotation"
          onAction={() => router.push("/quotations/new")}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Quotation No</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  <th className="py-3.5 px-4">Validity</th>
                  <th className="py-3.5 px-4 text-right">Items</th>
                  <th className="py-3.5 px-4 text-right">Grand Total</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {quotations.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#087ea4]">
                      <Link href={`/quotations/${q.id}`} className="hover:underline">
                        {q.quotationNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{q.customerName}</div>
                      {q.customerPhone && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {q.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(q.quotationDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                      {q.expiryDate
                        ? new Date(q.expiryDate).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                        : "-"}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 font-medium">
                      {q.items?.length || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-[12.5px]">
                      {formatCurrency(Number(q.grandTotal))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
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
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/quotations/${q.id}`}
                          className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                        >
                          View
                        </Link>
                        {q.status !== "CONVERTED" && (
                          <button
                            type="button"
                            onClick={() => setConvertTargetId(q.id)}
                            className="px-2.5 py-1 text-xs font-semibold bg-emerald-700 text-white rounded-md hover:bg-emerald-800 cursor-pointer shadow-2xs transition-colors"
                          >
                            Convert
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 font-medium">
            <span>
              Showing {quotations.length} of {totalCount} quotations
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

      <ConfirmDialog
        isOpen={Boolean(convertTargetId)}
        title="Convert Quotation to Bill?"
        message="This will create a new Tax Invoice with all products, quantities, prices, and customer information prefilled."
        confirmText="Convert to Bill"
        onConfirm={handleConvert}
        onCancel={() => setConvertTargetId(null)}
      />
    </div>
  );
}
