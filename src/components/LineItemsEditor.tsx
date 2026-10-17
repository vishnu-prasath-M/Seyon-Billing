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
  isInterState: boolean = false,
  enableGst: boolean = false
): LineItem {
  const baseAmount = item.quantity * item.rate;
  const discountAmount = Math.round(((baseAmount * item.discountPercent) / 100) * 100) / 100;
  const taxableAmount = Math.round((baseAmount - discountAmount) * 100) / 100;

  const gstPercent = enableGst ? (item.gstPercent || 18) : 0;
  const gstAmount = enableGst ? Math.round(((taxableAmount * gstPercent) / 100) * 100) / 100 : 0;
  const cgstAmount = enableGst && !isInterState ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const sgstAmount = enableGst && !isInterState ? Math.round((gstAmount / 2) * 100) / 100 : 0;
  const igstAmount = enableGst && isInterState ? gstAmount : 0;
  const amount = Math.round((taxableAmount + gstAmount) * 100) / 100;

  return {
    ...item,
    gstPercent,
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
  enableGst?: boolean;
}

let keyCounter = 0;
function genKey() {
  return `item-${++keyCounter}`;
}

export function createItem(
  product: Product,
  isInterState: boolean = false,
  enableGst: boolean = false
): LineItem {
  const partial = {
    _key: genKey(),
    productId: product.id,
    productName: product.name,
    productCode: product.code,
    hsnSac: product.hsnSac || undefined,
    unit: product.unit || "Sq.Ft",
    mrp: parseFloat(product.mrp?.toString() || "0") || 0,
    rate: parseFloat(product.sellingPrice?.toString() || "0") || 0,
    gstPercent: enableGst ? (parseFloat(product.gstPercent?.toString() || "18") || 18) : 0,
    quantity: 1,
    discountPercent: 0,
  };
  return calcItem(partial, isInterState, enableGst);
}

export default function LineItemsEditor({
  items,
  onChange,
  isInterState,
  enableGst = false,
}: LineItemsEditorProps) {
  function updateItem(key: string, field: keyof LineItem, val: string | number) {
    const next = items.map((item) => {
      if (item._key !== key) return item;
      const numVal = typeof val === "string" ? parseFloat(val) || 0 : val;
      const updated = { ...item, [field]: numVal };
      return calcItem(updated, isInterState, enableGst);
    });
    onChange(next);
  }

  function updateAmount(key: string, val: string | number) {
    const targetAmount = typeof val === "string" ? parseFloat(val) || 0 : val;
    const next = items.map((item) => {
      if (item._key !== key) return item;
      const qty = item.quantity || 1;
      const discFactor = 1 - (item.discountPercent || 0) / 100;
      const gstFactor = enableGst ? 1 + (item.gstPercent || 0) / 100 : 1;
      const newRate =
        qty > 0 && discFactor > 0 && gstFactor > 0
          ? Math.round((targetAmount / (qty * discFactor * gstFactor)) * 100) / 100
          : 0;
      return calcItem({ ...item, rate: newRate }, isInterState, enableGst);
    });
    onChange(next);
  }

  function removeItem(key: string) {
    onChange(items.filter((i) => i._key !== key));
  }

  function addProduct(product: Product) {
    const newItem = createItem(product, isInterState, enableGst);
    onChange([...items, newItem]);
  }

  const existingIds = items.map((i) => i.productId).filter(Boolean) as string[];

  return (
    <div className="space-y-4">
      {/* Product Search */}
      <div>
        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
          Add Products to Order (Sold per Sq.Ft)
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
                  <th className="py-3 px-2 text-center w-20">Unit</th>
                  <th className="py-3 px-2 text-right w-28 min-w-[110px]">
                    Price / Rate (₹) <span className="text-[#087ea4]">*</span>
                  </th>
                  <th className="py-3 px-2 text-right w-22 min-w-[85px]">Qty (Sq.Ft)</th>
                  <th className="py-3 px-2 text-right w-20 min-w-[76px]">Disc %</th>

                  {enableGst && (
                    <>
                      <th className="py-3 px-3 text-right w-26 min-w-[96px]">Taxable (₹)</th>
                      <th className="py-3 px-2 text-right w-20 min-w-[70px]">GST %</th>
                    </>
                  )}

                  <th className="py-3 px-4 text-right w-32 min-w-[120px]">
                    Amount (₹)
                  </th>
                  <th className="py-3 px-3 w-10 text-center"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((item) => (
                  <tr key={item._key} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{item.productName}</div>
                      <div className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                        {item.productCode} {item.hsnSac ? `• HSN: ${item.hsnSac}` : ""}
                      </div>
                    </td>

                    <td className="py-3 px-2 text-center text-[11px] font-semibold text-slate-700 bg-slate-50/50 rounded">
                      {item.unit || "Sq.Ft"}
                    </td>

                    {/* Price / Rate (Editable directly) */}
                    <td className="py-3 px-2 text-right">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.rate || ""}
                          placeholder="0.00"
                          onChange={(e) => updateItem(item._key, "rate", e.target.value)}
                          className="w-full min-w-[95px] px-2.5 py-1.5 text-xs text-right font-bold text-slate-900 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-2 focus:ring-[#087ea4]/20 focus:outline-none bg-white shadow-2xs hover:border-slate-400 transition-all"
                        />
                      </div>
                    </td>

                    {/* Quantity (Sq.Ft) */}
                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        min={0.001}
                        step={0.001}
                        value={item.quantity}
                        onChange={(e) => updateItem(item._key, "quantity", e.target.value)}
                        className="w-full min-w-[72px] px-2.5 py-1.5 text-xs text-right font-bold text-slate-900 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none bg-white shadow-2xs"
                      />
                    </td>

                    {/* Discount % */}
                    <td className="py-3 px-2 text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.01}
                        value={item.discountPercent || ""}
                        placeholder="0"
                        onChange={(e) => updateItem(item._key, "discountPercent", e.target.value)}
                        className="w-full min-w-[64px] px-2.5 py-1.5 text-xs text-right font-semibold border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none text-emerald-700 bg-white shadow-2xs"
                      />
                    </td>

                    {/* Taxable Amount & GST % (Only when GST is ON) */}
                    {enableGst && (
                      <>
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
                            className="w-full min-w-[56px] px-2 py-1.5 text-xs text-right font-mono text-slate-700 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none bg-white shadow-2xs"
                          />
                        </td>
                      </>
                    )}

                    {/* Editable Total Amount */}
                    <td className="py-3 px-4 text-right">
                      <div className="relative">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          value={item.amount || ""}
                          placeholder="0.00"
                          onChange={(e) => updateAmount(item._key, e.target.value)}
                          className="w-full min-w-[100px] px-2.5 py-1.5 text-xs text-right font-mono font-bold text-slate-900 border border-slate-300 rounded-md focus:border-[#087ea4] focus:ring-2 focus:ring-[#087ea4]/20 focus:outline-none bg-white shadow-2xs hover:border-slate-400 transition-all"
                        />
                      </div>
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
