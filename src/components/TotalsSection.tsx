"use client";
import { formatNumber, formatCurrency } from "@/lib/calculations";

interface Totals {
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  grandTotal: number;
}

interface TotalsSectionProps {
  totals: Totals;
  isInterState: boolean;
}

export function computeTotals(
  items: {
    quantity: number;
    rate: number;
    discountAmount: number;
    taxableAmount: number;
    gstPercent?: number;
    gstAmount?: number;
    cgstAmount?: number;
    sgstAmount?: number;
    igstAmount?: number;
    amount?: number;
  }[],
  isInterState: boolean = false
): Totals {
  const r2 = (n: number) => Math.round(n * 100) / 100;
  const subtotal = r2(items.reduce((s, i) => s + i.quantity * i.rate, 0));
  const discountAmount = r2(items.reduce((s, i) => s + i.discountAmount, 0));
  const taxableAmount = r2(items.reduce((s, i) => s + i.taxableAmount, 0));

  // Sum total GST across all line items
  const totalGst = r2(
    items.reduce(
      (s, i) =>
        s +
        (typeof i.gstAmount === "number"
          ? i.gstAmount
          : ((i.taxableAmount * (i.gstPercent != null ? Number(i.gstPercent) : 0)) / 100)),
      0
    )
  );

  const cgstAmount = isInterState ? 0 : r2(totalGst / 2);
  const sgstAmount = isInterState ? 0 : r2(totalGst - cgstAmount);
  const igstAmount = isInterState ? totalGst : 0;
  const grandTotal = r2(taxableAmount + totalGst);

  return {
    subtotal,
    discountAmount,
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    grandTotal,
  };
}

export default function TotalsSection({ totals, isInterState }: TotalsSectionProps) {
  return (
    <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs space-y-2.5 text-xs">
      <div className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
        Order Summary & Taxes
      </div>

      <div className="flex justify-between items-center text-slate-600 pb-2 border-b border-slate-100/80">
        <span>Subtotal (Items Base)</span>
        <span className="font-mono font-medium text-slate-800">
          ₹{formatNumber(totals.subtotal)}
        </span>
      </div>

      {totals.discountAmount > 0 && (
        <div className="flex justify-between items-center text-emerald-700 pb-2 border-b border-slate-100/80">
          <span>Discount (Total Deductions)</span>
          <span className="font-mono font-semibold">
            −₹{formatNumber(totals.discountAmount)}
          </span>
        </div>
      )}

      <div className="flex justify-between items-center text-slate-700 pb-2 border-b border-slate-100/80">
        <span className="font-medium">Taxable Amount</span>
        <span className="font-mono font-bold text-slate-900">
          ₹{formatNumber(totals.taxableAmount)}
        </span>
      </div>

      {isInterState ? (
        <div className="flex justify-between items-center text-slate-600 pb-2 border-b border-slate-100/80">
          <span>IGST (Interstate Supply)</span>
          <span className="font-mono font-medium text-slate-800">
            ₹{formatNumber(totals.igstAmount)}
          </span>
        </div>
      ) : (
        <>
          <div className="flex justify-between items-center text-slate-600 pb-1.5 border-slate-100/80">
            <span>CGST (Intrastate)</span>
            <span className="font-mono font-medium text-slate-800">
              ₹{formatNumber(totals.cgstAmount)}
            </span>
          </div>
          <div className="flex justify-between items-center text-slate-600 pb-2 border-b border-slate-100/80">
            <span>SGST (Intrastate)</span>
            <span className="font-mono font-medium text-slate-800">
              ₹{formatNumber(totals.sgstAmount)}
            </span>
          </div>
        </>
      )}

      <div className="flex justify-between items-center pt-2.5 border-t-2 border-[#087ea4] font-bold text-sm text-slate-900">
        <span className="text-slate-900 font-extrabold">Grand Total Amount</span>
        <span className="text-[#087ea4] font-mono text-[17px] font-black">
          {formatCurrency(totals.grandTotal)}
        </span>
      </div>
    </div>
  );
}
