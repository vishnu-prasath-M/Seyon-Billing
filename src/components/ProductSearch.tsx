"use client";
import { useState, useEffect, useRef } from "react";

interface Product {
  id: string;
  name: string;
  code: string;
  hsnSac?: string;
  unit: string;
  mrp: number | string;
  sellingPrice: number | string;
  gstPercent: number | string;
  category?: { name: string };
  isActive: boolean;
}

interface ProductSearchProps {
  onSelect: (product: Product) => void;
  placeholder?: string;
  excludeIds?: string[];
}

export default function ProductSearch({
  onSelect,
  placeholder = "Search UPVC product by name or SKU code...",
  excludeIds = [],
}: ProductSearchProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return;
    }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/products?search=${encodeURIComponent(query)}&isActive=true&limit=12`
        );
        const data = await res.json();
        const filtered = (data.products || []).filter(
          (p: Product) => !excludeIds.includes(p.id)
        );
        setResults(filtered);
        setOpen(filtered.length > 0);
      } finally {
        setLoading(false);
      }
    }, 200);
  }, [query, excludeIds]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  function handleSelect(product: Product) {
    onSelect(product);
    setQuery("");
    setResults([]);
    setOpen(false);
  }

  return (
    <div className="relative" ref={wrapRef}>
      <div className="relative flex items-center">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 flex items-center pointer-events-none text-slate-400 z-10">
          <svg className="w-4 h-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="6.5" cy="6.5" r="4.5" />
            <path d="M9.5 9.5 13 13" strokeLinecap="round" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          onFocus={() => results.length > 0 && setOpen(true)}
          autoComplete="off"
          style={{ paddingLeft: "42px", paddingRight: "36px" }}
          className="w-full py-2.5 text-xs text-slate-900 placeholder:text-slate-400 border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] shadow-xs"
        />
        {loading && (
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 flex items-center text-xs text-slate-400">
            <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-[#087ea4] rounded-full animate-spin" />
          </div>
        )}
      </div>

      {open && results.length > 0 && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg z-50 max-h-64 overflow-y-auto divide-y divide-neutral-100">
          {results.map((p) => (
            <div
              key={p.id}
              onClick={() => handleSelect(p)}
              className="px-3.5 py-2.5 hover:bg-neutral-50 cursor-pointer flex items-center justify-between transition-colors"
            >
              <div>
                <div className="text-xs font-semibold text-neutral-900">{p.name}</div>
                <div className="text-[10.5px] text-neutral-500 font-mono mt-0.5">
                  {p.code}
                  {p.hsnSac && ` · HSN: ${p.hsnSac}`}
                  {p.category && ` · ${p.category.name}`}
                  {` · ${p.unit}`}
                  {` · GST ${p.gstPercent}%`}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-bold font-mono text-[#174A5B]">
                  ₹{parseFloat(p.sellingPrice.toString()).toFixed(2)}
                </div>
                {p.mrp && Number(p.mrp) > Number(p.sellingPrice) && (
                  <div className="text-[10px] text-neutral-400 line-through">
                    ₹{parseFloat(p.mrp.toString()).toFixed(2)}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
