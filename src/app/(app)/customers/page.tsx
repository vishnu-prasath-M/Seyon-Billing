"use client";
import { useState, useEffect, useCallback } from "react";
import { LoadingState, EmptyState, Toast, useToast } from "@/components/ui";

interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstin?: string;
  placeOfSupply?: string;
  _count?: {
    bills: number;
    quotations: number;
  };
}

export default function CustomersPage() {
  const { toast, showToast, hideToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    pincode: "",
    gstin: "",
    placeOfSupply: "33-Tamil Nadu",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const loadCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/customers?search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCustomers(data.customers || []);
    } catch {
      showToast("Error loading customers", "error");
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadCustomers();
    }, 250);
    return () => clearTimeout(timer);
  }, [loadCustomers]);

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      pincode: "",
      gstin: "",
      placeOfSupply: "33-Tamil Nadu",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
      name: c.name || "",
      phone: c.phone || "",
      email: c.email || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "Tamil Nadu",
      pincode: c.pincode || "",
      gstin: c.gstin || "",
      placeOfSupply: c.placeOfSupply || "33-Tamil Nadu",
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      showToast("Customer name is required", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = editingCustomer
        ? `/api/customers/${editingCustomer.id}`
        : "/api/customers";
      const method = editingCustomer ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save customer", "error");
        setIsSubmitting(false);
        return;
      }

      showToast(
        editingCustomer ? "Customer updated!" : "Customer added successfully!",
        "success"
      );
      setIsModalOpen(false);
      loadCustomers();
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Customer Master Directory</h1>
          <p className="text-xs text-slate-500 mt-1">
            Shared client directory used for both normal and bulk billing counters
          </p>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="inline-flex items-center justify-center px-5 py-2.5 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] transition-all shadow-sm cursor-pointer"
        >
          + Add Customer
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by customer name, phone number, GSTIN, or city..."
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

      {/* Table */}
      {loading ? (
        <LoadingState message="Loading customers..." />
      ) : customers.length === 0 ? (
        <EmptyState
          title="No customers found"
          description="Add a customer or search with different keywords."
          actionLabel="+ Add New Customer"
          onAction={openAddModal}
        />
      ) : (
        <div className="bg-white border border-slate-200/90 rounded-xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3.5 px-4">Customer Name</th>
                  <th className="py-3.5 px-4">Phone</th>
                  <th className="py-3.5 px-4">GSTIN</th>
                  <th className="py-3.5 px-4">City / State</th>
                  <th className="py-3.5 px-4 text-center">Bills</th>
                  <th className="py-3.5 px-4 text-center">Quotations</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{c.name}</div>
                      {c.email && (
                        <div className="text-[11px] text-slate-400 font-medium mt-0.5">{c.email}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-700 font-semibold">
                      {c.phone || "-"}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11.5px] text-[#087ea4] font-semibold">
                      {c.gstin || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 font-medium">
                      {[c.city, c.state].filter(Boolean).join(", ") || "-"}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {c._count?.bills || 0}
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                      {c._count?.quotations || 0}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={() => openEditModal(c)}
                        className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                {editingCustomer ? "Edit Customer Details" : "Add New Customer"}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 text-sm p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1.5">
                    Customer / Business Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Ramesh Babu / Sri Krishna Constructions"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Email (Optional)</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="e.g. customer@example.com"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1.5">Address</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="Door no, Street name, Area"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="e.g. Coimbatore"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    placeholder="e.g. Tamil Nadu"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">GSTIN (Optional)</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={formData.gstin}
                    onChange={(e) =>
                      setFormData({ ...formData, gstin: e.target.value.toUpperCase() })
                    }
                    placeholder="e.g. 33AAAAA0000A1Z5"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Place of Supply</label>
                  <input
                    type="text"
                    value={formData.placeOfSupply}
                    onChange={(e) =>
                      setFormData({ ...formData, placeOfSupply: e.target.value })
                    }
                    placeholder="e.g. 33-Tamil Nadu"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-semibold shadow-2xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 bg-[#087ea4] text-white font-bold rounded-lg hover:bg-[#076b8b] disabled:opacity-50 cursor-pointer shadow-sm"
                >
                  {isSubmitting ? "Saving..." : editingCustomer ? "Update Customer" : "Save Customer"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
