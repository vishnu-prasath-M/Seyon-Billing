"use client";
import { useState, useEffect } from "react";

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  placeOfSupply?: string;
}

interface CustomerSelectorProps {
  value: Customer | null;
  onChange: (customer: Customer | null) => void;
  onSnapshot?: (snapshot: Record<string, string | undefined>) => void;
}

export default function CustomerSelector({
  value,
  onChange,
  onSnapshot,
}: CustomerSelectorProps) {
  const [customerData, setCustomerData] = useState({
    name: value?.name || "",
    phone: value?.phone || "",
    email: value?.email || "",
    address: value?.address || "",
    city: value?.city || "",
    state: value?.state || "Tamil Nadu",
    gstin: value?.gstin || "",
    placeOfSupply: value?.placeOfSupply || "33-Tamil Nadu",
  });

  // Keep state synced if value is provided from parent (e.g. converted from quotation)
  useEffect(() => {
    if (value) {
      setCustomerData({
        name: value.name || "",
        phone: value.phone || "",
        email: value.email || "",
        address: value.address || "",
        city: value.city || "",
        state: value.state || "Tamil Nadu",
        gstin: value.gstin || "",
        placeOfSupply: value.placeOfSupply || "33-Tamil Nadu",
      });
    }
  }, [value?.name, value?.phone]);

  function handleChange(field: string, val: string) {
    const updated = { ...customerData, [field]: val };
    setCustomerData(updated);

    const snapshot = {
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      address: [updated.address, updated.city, updated.state].filter(Boolean).join(", "),
      gstin: updated.gstin,
      placeOfSupply: updated.placeOfSupply || updated.state || "33-Tamil Nadu",
    };
    onSnapshot?.(snapshot);

    if (updated.name.trim()) {
      onChange({ id: value?.id || "", ...updated });
    } else {
      onChange(null);
    }
  }

  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <div className="pb-3.5 mb-4 border-b border-slate-100 flex items-center justify-between">
        <div>
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Customer Information
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Enter buyer details for this invoice
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
        <div className="sm:col-span-2">
          <label className="block text-slate-700 font-semibold mb-1.5">
            Customer Name *
          </label>
          <input
            type="text"
            required
            value={customerData.name}
            onChange={(e) => handleChange("name", e.target.value)}
            placeholder="e.g. Anand Builders"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            Phone Number
          </label>
          <input
            type="tel"
            value={customerData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="e.g. 9843012345"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            Email (Optional)
          </label>
          <input
            type="email"
            value={customerData.email}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="customer@example.com"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-slate-700 font-semibold mb-1.5">
            Address / Site Location
          </label>
          <input
            type="text"
            value={customerData.address}
            onChange={(e) => handleChange("address", e.target.value)}
            placeholder="Site / delivery address"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            GSTIN (Optional)
          </label>
          <input
            type="text"
            maxLength={15}
            value={customerData.gstin}
            onChange={(e) => handleChange("gstin", e.target.value.toUpperCase())}
            placeholder="33AABCS..."
            className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono uppercase focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">
            Place of Supply
          </label>
          <input
            type="text"
            value={customerData.placeOfSupply}
            onChange={(e) => handleChange("placeOfSupply", e.target.value)}
            placeholder="33-Tamil Nadu"
            className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}
