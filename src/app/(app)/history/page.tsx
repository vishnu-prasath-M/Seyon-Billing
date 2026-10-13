"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { formatCurrency } from "@/lib/calculations";
import { LoadingState, EmptyState, Toast, useToast } from "@/components/ui";

export default function HistoryPage() {
  const { toast, showToast, hideToast } = useToast();
  const [activeTab, setActiveTab] = useState<"bills" | "quotations">("bills");
  const [loading, setLoading] = useState<boolean>(true);
  const [items, setItems] = useState<any[]>([]);
  const [search, setSearch] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    const endpoint = activeTab === "bills" ? "/api/bills" : "/api/quotations";
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    params.set("limit", "50");

    fetch(`${endpoint}?${params.toString()}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (activeTab === "bills") {
          setItems(data?.bills || []);
        } else {
          setItems(data?.quotations || []);
        }
      })
      .catch(() => showToast("Error loading history", "error"))
      .finally(() => setLoading(false));
  }, [activeTab, search]);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Transaction History</h1>
          <p className="text-xs text-slate-500 mt-1">
            Workstation records of all generated tax invoices and quotation estimates
          </p>
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex border border-slate-300 rounded-xl overflow-hidden text-xs max-w-sm bg-white shadow-2xs p-1 gap-1">
          <button
            type="button"
            onClick={() => {
              setActiveTab("bills");
              setSearch("");
            }}
            className={`flex-1 py-2 px-4 font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "bills"
                ? "bg-[#087ea4] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Tax Invoices ({activeTab === "bills" ? items.length : "..."})
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab("quotations");
              setSearch("");
            }}
            className={`flex-1 py-2 px-4 font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === "quotations"
                ? "bg-[#087ea4] text-white shadow-xs"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            Quotations ({activeTab === "quotations" ? items.length : "..."})
          </button>
        </div>

        <div className="relative w-full sm:w-80">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${activeTab === "bills" ? "invoices" : "quotations"}...`}
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
      </div>

      {/* Content */}
      {loading ? (
        <LoadingState message={`Loading ${activeTab}...`} />
      ) : items.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} found`}
          description="No records match your criteria for this counter."
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">
                    {activeTab === "bills" ? "Invoice No" : "Quotation No"}
                  </th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Date</th>
                  {activeTab === "quotations" && <th className="py-3.5 px-4">Expiry</th>}
                  <th className="py-3.5 px-4 text-right">Amount</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((it) => (
                  <tr key={it.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-[#087ea4]">
                      <Link
                        href={activeTab === "bills" ? `/bills/${it.id}` : `/quotations/${it.id}`}
                        className="hover:underline"
                      >
                        {it.invoiceNumber || it.quotationNumber}
                      </Link>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{it.customerName}</div>
                      {it.customerPhone && (
                        <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                          {it.customerPhone}
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {new Date(it.invoiceDate || it.quotationDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </td>
                    {activeTab === "quotations" && (
                      <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                        {it.expiryDate
                          ? new Date(it.expiryDate).toLocaleDateString("en-IN", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "-"}
                      </td>
                    )}
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono text-[12.5px]">
                      {formatCurrency(Number(it.grandTotal))}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          it.paymentStatus === "PAID" || it.status === "ACCEPTED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : it.status === "CONVERTED"
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-slate-100 text-slate-700 border-slate-200"
                        }`}
                      >
                        {it.paymentStatus || it.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={activeTab === "bills" ? `/bills/${it.id}` : `/quotations/${it.id}`}
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
        </div>
      )}
    </div>
  );
}
