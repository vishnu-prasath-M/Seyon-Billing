"use client";
import { useState, useEffect, useRef } from "react";

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
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Customer[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<"search" | "manual">("search");
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Manual customer form
  const [manual, setManual] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    state: "Tamil Nadu",
    gstin: "",
    placeOfSupply: "33-Tamil Nadu",
  });

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim() || mode !== "search") {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/customers?search=${encodeURIComponent(query)}&limit=8`);
        const data = await res.json();
        setResults(data.customers || []);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, [query, mode]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(customer: Customer) {
    onChange(customer);
    const snapshot = {
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: [customer.address, customer.city, customer.state].filter(Boolean).join(", "),
      gstin: customer.gstin,
      placeOfSupply: customer.placeOfSupply || customer.state || "33-Tamil Nadu",
    };
    onSnapshot?.(snapshot);
    setQuery(customer.name);
    setOpen(false);
  }

  function handleManualChange(field: string, val: string) {
    const updated = { ...manual, [field]: val };
    setManual(updated);
    const snapshot = {
      name: updated.name,
      phone: updated.phone,
      email: updated.email,
      address: [updated.address, updated.city, updated.state].filter(Boolean).join(", "),
      gstin: updated.gstin,
      placeOfSupply: updated.placeOfSupply || updated.state || "33-Tamil Nadu",
    };
    onSnapshot?.(snapshot);
    if (updated.name) onChange({ id: "", ...updated });
    else onChange(null);
  }

  function clearCustomer() {
    onChange(null);
    onSnapshot?.({});
    setQuery("");
    setManual({
      name: "",
      phone: "",
      email: "",
      address: "",
      city: "",
      state: "Tamil Nadu",
      gstin: "",
      placeOfSupply: "33-Tamil Nadu",
    });
  }

  return (
    <div ref={wrapRef} className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
      <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-slate-100">
        <div>
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Customer & Billing Information
          </div>
          <div className="text-[11px] text-slate-400 mt-0.5">
            Select an existing customer or enter order details
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-xs bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => {
              setMode("search");
              clearCustomer();
            }}
            className={`px-3.5 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
              mode === "search"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            Search Directory
          </button>
          <button
            type="button"
            onClick={() => {
              setMode("manual");
              clearCustomer();
            }}
            className={`px-3.5 py-1.5 font-semibold rounded-md transition-all cursor-pointer ${
              mode === "manual"
                ? "bg-white text-slate-900 shadow-xs font-bold"
                : "text-slate-600 hover:text-slate-900"
            }`}
          >
            New / Manual Customer
          </button>
        </div>
      </div>

      {mode === "search" && (
        <div>
          {value && value.id ? (
            <div className="bg-slate-50/90 border border-slate-200 rounded-lg p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2.5">
                  <span className="font-bold text-slate-900 text-sm">{value.name}</span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    SELECTED
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                  {value.phone && <span>Ph: <strong className="text-slate-800">{value.phone}</strong></span>}
                  {value.city && <span>City: <strong className="text-slate-800">{value.city}</strong></span>}
                  {value.gstin && <span className="font-mono text-[#087ea4] font-semibold">GSTIN: {value.gstin}</span>}
                </div>
                {value.address && (
                  <div className="text-[11.5px] text-slate-500 mt-1">{value.address}</div>
                )}
              </div>
              <button
                type="button"
                onClick={clearCustomer}
                className="px-3 py-1.5 text-xs font-semibold border border-slate-300 rounded-md text-slate-700 hover:bg-slate-100 cursor-pointer shadow-2xs"
              >
                Change
              </button>
            </div>
          ) : (
            <div className="relative">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => results.length > 0 && setOpen(true)}
                placeholder="Type customer name, phone number, city or GSTIN to search..."
                className="w-full px-3.5 py-2.5 text-xs border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
              />

              {loading && (
                <div className="absolute right-3.5 top-2.5 text-xs text-slate-400">
                  Searching...
                </div>
              )}

              {open && results.length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border border-slate-200 rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto divide-y divide-slate-100">
                  {results.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => handleSelect(c)}
                      className="px-4 py-2.5 hover:bg-slate-50 cursor-pointer text-xs transition-colors"
                    >
                      <div className="font-bold text-slate-900">{c.name}</div>
                      <div className="text-[11px] text-slate-500 flex gap-3.5 mt-0.5">
                        {c.phone && <span>Ph: {c.phone}</span>}
                        {c.city && <span>{c.city}</span>}
                        {c.gstin && <span className="font-mono text-[#087ea4]">GSTIN: {c.gstin}</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {mode === "manual" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1.5">Customer Name *</label>
            <input
              type="text"
              required
              value={manual.name}
              onChange={(e) => handleManualChange("name", e.target.value)}
              placeholder="e.g. Anand Builders"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Phone Number</label>
            <input
              type="tel"
              value={manual.phone}
              onChange={(e) => handleManualChange("phone", e.target.value)}
              placeholder="e.g. 9843012345"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Email</label>
            <input
              type="email"
              value={manual.email}
              onChange={(e) => handleManualChange("email", e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-slate-700 font-semibold mb-1.5">Address</label>
            <input
              type="text"
              value={manual.address}
              onChange={(e) => handleManualChange("address", e.target.value)}
              placeholder="Site / delivery address"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">GSTIN (Optional)</label>
            <input
              type="text"
              maxLength={15}
              value={manual.gstin}
              onChange={(e) => handleManualChange("gstin", e.target.value.toUpperCase())}
              placeholder="33AABCS..."
              className="w-full px-3 py-2 border border-slate-300 rounded-md font-mono uppercase focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 font-semibold mb-1.5">Place of Supply</label>
            <input
              type="text"
              value={manual.placeOfSupply}
              onChange={(e) => handleManualChange("placeOfSupply", e.target.value)}
              placeholder="33-Tamil Nadu"
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
            />
          </div>
        </div>
      )}
    </div>
  );
}
