"use client";
import ProductSearch from "./ProductSearch";
import { formatNumber } from "@/lib/calculations";

export interface LineItem {
  _key: string;
  productId?: string;
  productName: string;
  productCode: string;
  hsnSac?: string;
  unit: string;
  mrp: number;
  rate: number;
  gstPercent: number;
  quantity: number;
  discountPercent: number;
  discountAmount: number;
  taxableAmount: number;
  gstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  amount: number;
}

interface Product {
  id: string;
  name: string;
  code: string;
  hsnSac?: string;
  unit: string;
  mrp: number | string;
  sellingPrice: number | string;
  gstPercent: number | string;
}

export function calcItem(
  item: Omit<
    LineItem,
    | "discountAmount"
    | "taxableAmount"
    | "gstAmount"
    | "cgstAmount"
    | "sgstAmount"
    | "igstAmount"
    | "amount"
  >,
  isInterState: boolean
): LineItem {
  const baseAmount = item.quantity * item.rate;
  const discountAmount = Math.round(((baseAmount * item.discountPercent) / 100) * 100) / 100;
  const taxableAmount = Math.round((baseAmount - discountAmount) * 100) / 100;
  const gstAmount = Math.round(((taxableAmount * item.gstPercent) / 100) * 100) / 100;
  const cgstAmount = isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100;
  const sgstAmount = isInterState ? 0 : Math.round((gstAmount / 2) * 100) / 100;
  const igstAmount = isInterState ? gstAmount : 0;
  const amount = Math.round((taxableAmount + gstAmount) * 100) / 100;
  return {
    ...item,
    discountAmount,
    taxableAmount,
    gstAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    amount,
  };
}

interface LineItemsEditorProps {
  items: LineItem[];
  onChange: (items: LineItem[]) => void;
  isInterState: boolean;
}

let keyCounter = 0;
function genKey() {
  return `item-${++keyCounter}`;
}

export function createItem(product: Product, isInterState: boolean): LineItem {
  const partial = {
    _key: genKey(),
    productId: product.id,
    productName: product.name,
    productCode: product.code,
    hsnSac: product.hsnSac || undefined,
    unit: product.unit || "Nos",
    mrp: parseFloat(product.mrp?.toString() || "0") || 0,
    rate: parseFloat(product.sellingPrice?.toString() || "0") || 0,
    gstPercent: 0, // Default 0% GST: Rate is final bill price
    quantity: 1,
    discountPercent: 0,
  };
  return calcItem(partial, isInterState);
}

export default function LineItemsEditor({
  items,
  onChange,
  isInterState,
}: LineItemsEditorProps) {
  function updateItem(key: string, field: keyof LineItem, val: string | number) {
    const next = items.map((item) => {
      if (item._key !== key) return item;
      const numVal = typeof val === "string" ? parseFloat(val) || 0 : val;
      const updated = { ...item, [field]: numVal };
      return calcItem(updated, isInterState);
    });
    onChange(next);
  }

  function removeItem(key: string) {
    onChange(items.filter((i) => i._key !== key));
  }

  function addProduct(product: Product) {
    const newItem = createItem(product, isInterState);
    onChange([...items, newItem]);
  }

  const existingIds = items.map((i) => i.productId).filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {/* Product Search */}
      <div>
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Add Products to Order
        </div>
        <ProductSearch onSelect={addProduct} excludeIds={existingIds} />
      </div>

      {items.length === 0 ? (
        <div className="text-center py-10 px-6 text-slate-500 text-xs border border-dashed border-slate-300 rounded-xl bg-slate-50/50">
          <p className="font-medium text-slate-700 mb-1">No items added yet</p>
          <p className="text-slate-400">Search and select items from the catalogue above to add them to this order</p>
        </div>
      ) : (
        <div className="border border-slate-200/90 rounded-xl overflow-hidden bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-200 text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4 min-w-[220px]">Product / Description</th>
                  <th className="py-3 px-2 text-center w-20">HSN</th>
                  <th className="py-3 px-2 text-center w-16">Unit</th>
                  <th className="py-3 px-2 text-right w-24 min-w-[96px]">MRP (₹)</th>
                  <th className="py-3 px-2 text-right w-26 min-w-[100px]">Rate (₹)</th>
                  <th className="py-3 px-2 text-right w-20 min-w-[80px]">Qty</th>
                  <th className="py-3 px-2 text-right w-20 min-w-[76px]">Disc %</th>
                  <th className="py-3 px-3 text-right w-26 min-w-[96px]">Taxable (₹)</th>
                  <th className="py-3 px-2 text-right w-18">GST %</th>
                  <th className="py-3 px-4 text-right w-30 min-w-[110px]">Amount (₹)</th>
                  <th className="py-3 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                        {item.productCode}
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center font-mono text-[11px] text-slate-600">
                      {item.hsnSac || "-"}
                    </td>

                    <td className="py-3 px-2 text-center text-[11px] text-slate-600">
                      {item.unit}
                    </td>

                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.mrp || ""}
                        onChange={(e) => updateItem(item._key, "mrp", e.target.value)}
                        className="w-full min-w-[84px] px-2.5 py-1.5 text-xs text-right font-medium text-slate-800 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none bg-white"
                      />
                    </td>

                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step={0.01}
                        value={item.rate || ""}
                        onChange={(e) => updateItem(item._key, "rate", e.target.value)}
                        className="w-full min-w-[88px] px-2.5 py-1.5 text-xs text-right font-semibold text-slate-900 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none bg-white"
                      />
                    </td>

                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        min={0.001}
                        step={0.001}
                        value={item.quantity}
                        onChange={(e) => updateItem(item._key, "quantity", e.target.value)}
                        className="w-full min-w-[68px] px-2.5 py-1.5 text-xs text-right font-bold text-slate-900 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none bg-white"
                      />
                    </td>

                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={item.discountPercent || ""}
                        placeholder="0"
                        onChange={(e) => updateItem(item._key, "discountPercent", e.target.value)}
                        className="w-full min-w-[64px] px-2.5 py-1.5 text-xs text-right font-semibold border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none text-emerald-700 bg-white"
                      />
                    </td>

                    <td className="py-3 px-3 text-right font-mono text-slate-700 font-medium">
                      {formatNumber(item.taxableAmount)}
                    </td>

                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={item.gstPercent}
                        onChange={(e) => updateItem(item._key, "gstPercent", e.target.value)}
                        className="w-full min-w-[56px] px-2 py-1.5 text-xs text-right font-mono text-slate-700 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none bg-white"
                      />
                    </td>

                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 text-[12.5px]">
                      ₹{formatNumber(item.amount)}
                    </td>

                    <td className="py-3 px-3 text-center">
                      <button
                        type="button"
                        onClick={() => removeItem(item._key)}
                        className="text-slate-400 hover:text-rose-600 p-1.5 rounded-md hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Remove Item"
                      >
                        ✕
                      </button>
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
