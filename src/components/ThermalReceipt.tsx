"use client";
import React from "react";
import { formatCurrency, formatNumber } from "@/lib/calculations";
import { DocumentData } from "./QuotationDocument";

export default function ThermalReceipt({ data }: { data: DocumentData }) {
  const company = data.settings || {};
  const companyName = company.companyName || "SEYON UPVC";

  return (
    <div className="w-[80mm] mx-auto bg-white text-black font-mono text-[11px] p-3 leading-tight print:p-0 print:w-[80mm] print:m-0">
      <div className="text-center pb-2 border-b border-black">
        <div className="font-bold text-sm tracking-wide">{companyName}</div>
        {company.address && <div className="text-[10px]">{company.address}</div>}
        {company.phone && <div className="text-[10px]">Ph: {company.phone}</div>}
        {company.gstin && <div className="text-[10px]">GSTIN: {company.gstin}</div>}
        <div className="font-bold text-xs mt-1 border-t border-dashed border-black pt-1">
          {data.type === "invoice" ? "TAX INVOICE" : "QUOTATION"}
        </div>
      </div>

      <div className="py-2 text-[10px] border-b border-dashed border-black">
        <div className="flex justify-between">
          <span>{data.type === "invoice" ? "Inv No:" : "Quot No:"} {data.number}</span>
          <span>{new Date(data.date).toLocaleDateString("en-IN")}</span>
        </div>
        <div>Cust: {data.customer.name}</div>
        {data.customer.phone && <div>Ph: {data.customer.phone}</div>}
        {data.counterName && <div>Counter: {data.counterName}</div>}
      </div>

      <div className="py-1">
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b border-black text-left">
              <th className="py-1">Item</th>
              <th className="py-1 text-right">Qty</th>
              <th className="py-1 text-right">Rate</th>
              <th className="py-1 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-dotted border-neutral-300">
                <td className="py-1 max-w-[32mm] truncate">{item.productName}</td>
                <td className="py-1 text-right">{formatNumber(item.quantity)}</td>
                <td className="py-1 text-right">{formatNumber(item.rate)}</td>
                <td className="py-1 text-right font-bold">{formatNumber(item.totalAmount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="border-t border-black pt-1 space-y-0.5 text-[10px]">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>{formatCurrency(data.subtotal)}</span>
        </div>
        {data.discountAmount > 0 && (
          <div className="flex justify-between">
            <span>Discount:</span>
            <span>-{formatCurrency(data.discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between">
          <span>Taxable:</span>
          <span>{formatCurrency(data.taxableAmount)}</span>
        </div>
        {data.igstAmount > 0 ? (
          <div className="flex justify-between">
            <span>IGST:</span>
            <span>{formatCurrency(data.igstAmount)}</span>
          </div>
        ) : (
          <>
            <div className="flex justify-between">
              <span>CGST:</span>
              <span>{formatCurrency(data.cgstAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span>SGST:</span>
              <span>{formatCurrency(data.sgstAmount)}</span>
            </div>
          </>
        )}
        <div className="flex justify-between text-xs font-bold border-t border-black pt-1 mt-1">
          <span>TOTAL:</span>
          <span>{formatCurrency(data.grandTotal)}</span>
        </div>
      </div>

      <div className="text-center pt-3 border-t border-dashed border-black mt-2 text-[9px]">
        <div>Thank You! Visit Again.</div>
        <div className="text-[8px] text-neutral-600 mt-1">Computer Generated Receipt</div>
      </div>
    </div>
  );
}
