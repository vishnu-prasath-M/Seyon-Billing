"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { LoadingState, EmptyState, Toast, useToast, ConfirmDialog } from "@/components/ui";

interface Product {
  id: string;
  name: string;
  code: string;
  hsnSac?: string;
  unit: string;
  mrp: number | string;
  sellingPrice: number | string;
  gstPercent: number | string;
  stock?: number;
  trackStock: boolean;
  isActive: boolean;
  category?: { name: string };
}

function formatINR(amount: number | string) {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  return `₹${num.toFixed(2)}`;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [confirm, setConfirm] = useState<{ id: string; name: string; isActive: boolean } | null>(null);
  const { toast, showToast, hideToast } = useToast();
  const limit = 20;

  async function load() {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search) params.set("search", search);
      if (status) params.set("isActive", status);
      const res = await fetch(`/api/products?${params}`);
      const data = await res.json();
      setProducts(data.products || []);
      setTotal(data.total || 0);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setPage(1);
  }, [search, status]);

  useEffect(() => {
    load();
  }, [page, search, status]);

  async function toggleStatus(id: string, isActive: boolean) {
    const res = await fetch(`/api/products/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (res.ok) {
      showToast(`Product ${isActive ? "deactivated" : "activated"} successfully.`);
      load();
    } else {
      showToast("Failed to update product status.", "error");
    }
    setConfirm(null);
  }

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      {confirm && (
        <ConfirmDialog
          isOpen={true}
          title={confirm.isActive ? "Deactivate Product" : "Activate Product"}
          message={`Are you sure you want to ${confirm.isActive ? "deactivate" : "activate"} "${confirm.name}"?`}
          confirmLabel={confirm.isActive ? "Deactivate" : "Activate"}
          danger={confirm.isActive}
          onConfirm={() => toggleStatus(confirm.id, confirm.isActive)}
          onCancel={() => setConfirm(null)}
        />
      )}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Products Master</h1>
          <p className="text-xs text-slate-500 mt-1">
            Centralized UPVC profile, hardware and accessories catalog — synchronized across workstations
          </p>
        </div>

        <Link
          href="/products/new"
          className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] transition-all shadow-sm"
        >
          + Add Product
        </Link>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product name, SKU or HSN code..."
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
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] bg-white text-slate-800 shadow-2xs cursor-pointer font-medium"
          >
            <option value="">All Statuses</option>
            <option value="true">Active Products</option>
            <option value="false">Inactive Products</option>
          </select>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading product catalog..." />
      ) : products.length === 0 ? (
        <EmptyState
          title="No products found"
          description={
            search || status
              ? "Try adjusting your search query or filter."
              : "No products added to the master yet."
          }
          actionLabel="+ Add First Product"
          onAction={() => {}}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Product Name</th>
                  <th className="py-3.5 px-4">Code / HSN</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4">Unit</th>
                  <th className="py-3.5 px-4 text-right">MRP</th>
                  <th className="py-3.5 px-4 text-right">Selling Rate</th>
                  <th className="py-3.5 px-4 text-right">GST</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{p.name}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-600">
                      <div className="font-semibold text-slate-800">{p.code}</div>
                      {p.hsnSac && <div className="text-slate-400">HSN: {p.hsnSac}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-slate-700 font-medium">
                      {p.category?.name || "—"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {p.unit}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-500">
                      {formatINR(p.mrp)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-bold text-slate-900 text-[12.5px]">
                      {formatINR(p.sellingPrice)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700 font-medium">
                      {p.gstPercent}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                          p.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-slate-100 text-slate-600 border-slate-200"
                        }`}
                      >
                        {p.isActive ? "ACTIVE" : "INACTIVE"}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/products/${p.id}/edit`}
                          className="px-2.5 py-1 text-xs font-semibold border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 shadow-2xs transition-colors"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => setConfirm({ id: p.id, name: p.name, isActive: p.isActive })}
                          className={`px-2.5 py-1 text-xs font-semibold border rounded-md cursor-pointer shadow-2xs transition-colors ${
                            p.isActive
                              ? "border-rose-200 text-rose-700 hover:bg-rose-50"
                              : "border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                          }`}
                        >
                          {p.isActive ? "Deactivate" : "Activate"}
                        </button>
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
              Showing {products.length} of {total} products
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
                Page {page} of {totalPages || 1}
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
