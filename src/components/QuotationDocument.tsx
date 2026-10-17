"use client";
import React from "react";
import { formatCurrency, formatNumber, numberToWords } from "@/lib/calculations";

export interface DocumentItem {
  id?: string;
  productName: string;
  productCode?: string;
  hsnSac?: string;
  quantity: number;
  unit?: string;
  mrp?: number;
  rate: number;
  discountPercent?: number;
  discountAmount?: number;
  taxableAmount: number;
  gstPercent: number;
  gstAmount?: number;
  cgstAmount?: number;
  sgstAmount?: number;
  igstAmount?: number;
  totalAmount: number;
}

export interface DocumentData {
  type: "quotation" | "invoice";
  number: string;
  date: string;
  expiryDate?: string;
  status?: string;
  counterName?: string;
  createdByName?: string;
  customer: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    city?: string;
    state?: string;
    gstin?: string;
    placeOfSupply?: string;
  };
  shipTo?: {
    name?: string;
    address?: string;
    city?: string;
    state?: string;
    phone?: string;
  };
  salesPerson?: string;
  items: DocumentItem[];
  subtotal: number;
  discountAmount: number;
  taxableAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
  roundOff?: number;
  grandTotal: number;
  notes?: string;
  settings?: {
    companyName?: string;
    tagline?: string;
    logoUrl?: string;
    address?: string;
    city?: string;
    state?: string;
    pincode?: string;
    phone?: string;
    email?: string;
    website?: string;
    gstin?: string;
    pan?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankAccount?: string;
    bankIfsc?: string;
    bankIFSC?: string;
    bankBranch?: string;
    quotationTerms?: string;
    invoiceTerms?: string;
  };
}

export default function QuotationDocument({ data }: { data: DocumentData }) {
  const isInvoice = data.type === "invoice";
  const hasIgst = (data.igstAmount || 0) > 0;
  const totalTaxAmount = hasIgst
    ? (data.igstAmount || 0)
    : (data.cgstAmount || 0) + (data.sgstAmount || 0);

  const docTypeHeader = isInvoice
    ? totalTaxAmount > 0
      ? "TAX INVOICE"
      : "INVOICE / BILL OF SUPPLY"
    : "QUOTATION";
  const docNumberLabel = isInvoice ? "Invoice No.:" : "Quotation No.:";
  const docDateLabel = isInvoice ? "Invoice Date:" : "Quotation Date:";

  const company = data.settings || {};
  const companyName = company.companyName || "SEYON UPVC WINDOWS & DOORS";
  const companyAddress = [
    company.address || "SF No 245, Avinashi Road, Civil Aerodrome Post",
    [company.city || "Coimbatore", company.state || "Tamil Nadu", company.pincode || "641014"]
      .filter(Boolean)
      .join(", "),
  ]
    .filter(Boolean)
    .join(" - ");


  const totalQuantity = data.items.reduce(
    (sum, item) => sum + (Number(item.quantity) || 0),
    0
  );

  const totalDiscounts = data.items.reduce((sum, item) => {
    const d =
      item.discountAmount ||
      (item.discountPercent
        ? (item.quantity * item.rate * item.discountPercent) / 100
        : 0);
    return sum + d;
  }, 0);

  const formattedDate = new Date(data.date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const formattedExpiry = data.expiryDate
    ? new Date(data.expiryDate).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    : "-";

  const bankName = company.bankName || "State Bank of India";
  const bankAcc = company.bankAccountNo || company.bankAccount || "38920192831";
  const bankIfsc = company.bankIfsc || company.bankIFSC || "SBIN0001234";
  const bankBranch = company.bankBranch || "Coimbatore Main Branch";

  const termsList = isInvoice
    ? [
        "1. Goods once sold will not be taken back or exchanged.",
        "2. 100% payment before load from warehouse.",
        "3. Transportation and site unloading excluded unless specified.",
        "4. 15 years warranty on UPVC profiles against discoloration.",
        "5. All disputes subject to local jurisdiction only.",
        "6. Interest @ 18% p.a. will be charged on overdue payments.",
      ]
    : [
        "1. 100 % advance for upto 3 machines / standard orders.",
        "2. 30% advance & 70% before load from warehouse.",
        "3. 100% advance for hardwares and accessories.",
        "4. Transportation excluded unless specified in agreement.",
        "5. 15 month warranty and 2 year guarantee of PLC / profile.",
        "6. If it's a bank loan 100% advance confirmation required.",
        "7. Delivery time- 15 days.",
        "8. CNC corner cleaning machine: delivery time- 25 days.",
      ];

  const websiteDisplay = (company.website || "WWW.SEYONUPVC.COM").toUpperCase();

  return (
    <div className="bg-white text-[#111827] font-sans text-[11px] leading-relaxed p-4 sm:p-8 md:p-12 max-w-[850px] mx-auto border border-neutral-300 shadow-sm print:border-none print:shadow-none print:p-0 print:max-w-none print:m-0 print:text-[10.5px]">
      {/* 1. Top Type Marker */}
      <div className="text-[10.5px] font-bold tracking-[0.2em] text-neutral-800 uppercase mb-3">
        {docTypeHeader}
      </div>

      {/* 2. Header with Logo & Company Info */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-4 sm:gap-6 pb-4">
        {/* Logo */}
        <div className="flex-shrink-0 pt-0.5">
          <img
            src="/seyon-logo.png"
            alt="Seyon UPVC Logo"
            className="h-16 sm:h-20 w-auto max-w-[90px] object-contain"
            onError={(e) => {
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        {/* Company Title & Details */}
        <div className="flex-1 text-left">
          <h1 className="text-[19px] sm:text-[21px] font-extrabold tracking-tight text-[#087ea4] leading-tight mb-1">
            {companyName}
          </h1>
          <p className="text-[10.5px] text-neutral-600 font-medium leading-snug max-w-xl mb-1.5">
            {companyAddress}
          </p>
          <div className="text-[10.5px] text-neutral-700 space-y-0.5">
            <div>
              <span className="font-semibold text-neutral-900">GSTIN: </span>
              <span className="font-mono">{company.gstin || "33AABCS1234A1Z5"}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-900">Email: </span>
              <span>{company.email || "seyonupvc@gmail.com"}</span>
            </div>
            <div>
              <span className="font-semibold text-neutral-900">{websiteDisplay}: </span>
              <span className="text-[#087ea4] font-medium">{websiteDisplay}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Subtle Slate / Gray-Blue Details Banner Bar */}
      <div className="bg-[#EEF4F7] text-neutral-800 border border-[#D5E3EB] px-3 sm:px-4 py-2 rounded-xs flex flex-wrap items-center justify-between gap-2 text-[11px] mb-3">
        <div>
          <span className="text-neutral-700">{docNumberLabel} </span>
          <span className="font-bold text-neutral-900 font-mono">{data.number}</span>
        </div>
        <div>
          <span className="text-neutral-700">{docDateLabel} </span>
          <span className="font-bold text-neutral-900">{formattedDate}</span>
        </div>
        {data.expiryDate && (
          <div>
            <span className="text-neutral-700">Expiry Date: </span>
            <span className="font-bold text-neutral-900">{formattedExpiry}</span>
          </div>
        )}
        {data.status && isInvoice && (
          <div>
            <span className="text-neutral-700">Status: </span>
            <span className={`font-bold font-mono px-2 py-0.5 rounded text-[10px] ${
              data.status === "PAID"
                ? "bg-emerald-100 text-emerald-800"
                : data.status === "PARTIAL"
                ? "bg-amber-100 text-amber-800"
                : "bg-rose-100 text-rose-800"
            }`}>
              {data.status}
            </span>
          </div>
        )}
      </div>

      {/* 4. Parties & Order Info (Bill To, Ship To, Sales Person) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3.5 sm:gap-5 pb-3 mb-2 text-[11px]">
        {/* Bill To */}
        <div className="sm:col-span-5">
          <div className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1">
            BILL TO
          </div>
          <div className="font-bold text-neutral-900 text-[12.5px] mb-0.5">
            {data.customer.name}
          </div>
          <div className="text-neutral-700 text-[10.5px]">
            Place of Supply: <span className="font-medium">{data.customer.placeOfSupply || "Tamil Nadu"}</span>
          </div>
          {data.customer.phone && (
            <div className="text-neutral-600 text-[10.5px] mt-0.5">Ph: {data.customer.phone}</div>
          )}
          {data.customer.address && (
            <div className="text-neutral-600 text-[10.5px] mt-0.5 leading-snug">
              {data.customer.address}
              {data.customer.city && `, ${data.customer.city}`}
            </div>
          )}
          {data.customer.gstin && (
            <div className="text-[#087ea4] font-mono text-[10.5px] font-semibold mt-0.5">
              GSTIN: {data.customer.gstin}
            </div>
          )}
        </div>

        {/* Ship To */}
        <div className="sm:col-span-4">
          <div className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1">
            SHIP TO
          </div>
          <div className="font-bold text-neutral-900 text-[12.5px] mb-0.5">
            {data.shipTo?.name || data.customer.name}
          </div>
          {data.shipTo?.address ? (
            <div className="text-neutral-600 text-[10.5px] leading-snug">{data.shipTo.address}</div>
          ) : (
            <div className="text-neutral-600 text-[10.5px] leading-snug">
              {data.customer.address || "Same as Billing Address"}
            </div>
          )}
        </div>

        {/* Sales Person */}
        <div className="sm:col-span-3 sm:text-right">
          <div className="text-[10px] font-bold text-neutral-800 uppercase tracking-wider mb-1">
            SALES PERSON
          </div>
          <div className="font-bold text-neutral-900 font-mono text-[11.5px]">
            {data.salesPerson || "10025"}
          </div>
        </div>
      </div>

      {/* 5. Line Items Table */}
      <div className="overflow-x-auto w-full border-t-2 border-[#087ea4] mb-2">
        <table className="w-full min-w-[560px] sm:min-w-full text-[10.5px] border-collapse">
          <thead>
            <tr className="border-b border-neutral-300 text-neutral-900 font-bold uppercase text-[9.5px]">
              <th className="py-2.5 px-1.5 text-left">ITEMS/SERVICES</th>
              {totalTaxAmount > 0 && <th className="py-2.5 px-1 text-center w-20">HSN/SAC</th>}
              <th className="py-2.5 px-1 text-right w-16">QTY.</th>
              <th className="py-2.5 px-1 text-right w-18">MRP</th>
              <th className="py-2.5 px-1 text-right w-20">RATE</th>
              <th className="py-2.5 px-1 text-right w-18">DISC.</th>
              {totalTaxAmount > 0 && <th className="py-2.5 px-1 text-right w-18">TAX</th>}
              <th className="py-2.5 px-1.5 text-right w-24">AMOUNT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {data.items.map((item, idx) => {
              const itemDiscAmount =
                item.discountAmount ||
                (item.discountPercent
                  ? (item.quantity * item.rate * item.discountPercent) / 100
                  : 0);

              const itemTaxAmount =
                item.gstAmount ||
                (item.taxableAmount * item.gstPercent) / 100;

              return (
                <tr key={idx} className="align-top">
                  {/* Item Description */}
                  <td className="py-3 px-1.5 pr-3">
                    <div className="font-bold text-neutral-900 uppercase leading-snug">
                      {item.productName}
                    </div>
                    {item.productCode && (
                      <div className="text-[9px] text-neutral-500 font-mono mt-0.5">
                        {item.productCode}
                      </div>
                    )}
                  </td>

                  {/* HSN/SAC (Only if GST is active) */}
                  {totalTaxAmount > 0 && (
                    <td className="py-3 px-1 text-center font-mono text-[10px] text-neutral-700">
                      {item.hsnSac || "-"}
                    </td>
                  )}

                  {/* Qty */}
                  <td className="py-3 px-1 text-right font-medium text-neutral-800 whitespace-nowrap">
                    {formatNumber(item.quantity)} {item.unit || "Sq.Ft"}
                  </td>

                  {/* MRP */}
                  <td className="py-3 px-1 text-right text-neutral-700 whitespace-nowrap">
                    {item.mrp ? (
                      <>
                        <div>{formatNumber(item.mrp)}</div>
                        {item.mrp > item.rate && (
                          <div className="text-[8.5px] text-neutral-500">
                            ({Math.round(((item.mrp - item.rate) / item.mrp) * 100)}% OFF)
                          </div>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Rate */}
                  <td className="py-3 px-1 text-right font-medium text-neutral-800 whitespace-nowrap">
                    {formatNumber(item.rate)}
                  </td>

                  {/* Discount */}
                  <td className="py-3 px-1 text-right text-neutral-800 whitespace-nowrap">
                    {itemDiscAmount > 0 ? (
                      <>
                        <div>{formatNumber(itemDiscAmount)}</div>
                        <div className="text-[8.5px] text-neutral-500">
                          ({item.discountPercent}%)
                        </div>
                      </>
                    ) : (
                      "-"
                    )}
                  </td>

                  {/* Tax (Only if GST is active) */}
                  {totalTaxAmount > 0 && (
                    <td className="py-3 px-1 text-right text-neutral-800 whitespace-nowrap">
                      <div>{formatNumber(itemTaxAmount)}</div>
                      <div className="text-[8.5px] text-neutral-500">
                        ({item.gstPercent}%)
                      </div>
                    </td>
                  )}

                  {/* Amount */}
                  <td className="py-3 px-1.5 text-right font-bold text-neutral-900 whitespace-nowrap">
                    {formatNumber(item.totalAmount)}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* 6. Subtotal Bar */}
      <div className="border-t-2 border-[#087ea4] border-b border-[#087ea4] py-2.5 px-1.5 mb-5 font-bold text-[10.5px] flex items-center justify-between">
        <span className="uppercase tracking-wider">SUBTOTAL</span>
        <div className="flex items-center gap-5 text-right">
          <span className="w-16">{formatNumber(totalQuantity)}</span>
          <span className="w-18">₹ {formatNumber(totalDiscounts || data.discountAmount)}</span>
          {totalTaxAmount > 0 && <span className="w-18">₹ {formatNumber(totalTaxAmount)}</span>}
          <span className="w-24">₹ {formatNumber(data.grandTotal)}</span>
        </div>
      </div>

      {/* 7. Bottom Section (Left: Bank + Terms, Right: Calculations + Words + Signature) */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-6 sm:gap-8 text-[10.5px]">
        {/* Left Column */}
        <div className="col-span-12 sm:col-span-7 space-y-4">
          {/* Bank Details */}
          <div>
            <div className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] mb-1.5">
              BANK DETAILS
            </div>
            <div className="text-[10px] space-y-0.5 text-neutral-700">
              <div>
                <span className="font-semibold text-neutral-900">Name: </span>
                {companyName}
              </div>
              <div>
                <span className="font-semibold text-neutral-900">IFSC Code: </span>
                <span className="font-mono">{bankIfsc}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Account No: </span>
                <span className="font-mono font-bold text-neutral-900">{bankAcc}</span>
              </div>
              <div>
                <span className="font-semibold text-neutral-900">Bank: </span>
                {bankName}, {bankBranch}
              </div>
            </div>
          </div>

          {/* Terms and Conditions */}
          <div>
            <div className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] mb-1.5">
              TERMS AND CONDITIONS
            </div>
            <div className="text-[9.5px] text-neutral-600 leading-relaxed space-y-0.5">
              {termsList.map((term, tIdx) => (
                <div key={tIdx}>{term}</div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="col-span-12 sm:col-span-5 space-y-3">
          {/* Tax Breakdown */}
          <div className="space-y-1.5 text-[11px] border-b border-neutral-300 pb-2">
            {totalTaxAmount > 0 ? (
              <>
                <div className="flex justify-between items-center text-neutral-700">
                  <span>Taxable Amount</span>
                  <span className="font-medium">₹ {formatNumber(data.taxableAmount)}</span>
                </div>

                {!hasIgst ? (
                  <>
                    <div className="flex justify-between items-center text-neutral-700">
                      <span>CGST</span>
                      <span className="font-medium">₹ {formatNumber(data.cgstAmount)}</span>
                    </div>
                    <div className="flex justify-between items-center text-neutral-700">
                      <span>SGST</span>
                      <span className="font-medium">₹ {formatNumber(data.sgstAmount)}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex justify-between items-center text-neutral-700">
                    <span>IGST</span>
                    <span className="font-medium">₹ {formatNumber(data.igstAmount)}</span>
                  </div>
                )}
              </>
            ) : (
              <div className="flex justify-between items-center text-neutral-700">
                <span>Items Subtotal</span>
                <span className="font-medium">₹ {formatNumber(data.subtotal)}</span>
              </div>
            )}
          </div>

          {/* Grand Total */}
          <div className="border-t-2 border-b-2 border-neutral-900 py-2 flex justify-between items-center font-bold text-[13.5px] text-neutral-900">
            <span>Total Amount</span>
            <span>₹ {formatNumber(data.grandTotal)}</span>
          </div>

          {/* Amount in words */}
          <div className="text-right pt-1">
            <div className="text-[9.5px] text-neutral-500 font-medium">Total Amount (in words)</div>
            <div className="text-[10.5px] font-semibold text-neutral-900 leading-snug">
              {numberToWords(data.grandTotal)}
            </div>
          </div>

          {/* Authorised Signatory */}
          <div className="pt-6 text-right space-y-1">
            <div className="inline-block pr-4 font-serif italic text-[22px] text-neutral-900 font-bold tracking-wider">
              Seyon.
            </div>
            <div className="text-[9px] font-bold text-neutral-600 uppercase tracking-wider">
              AUTHORISED SIGNATORY FOR
            </div>
            <div className="text-[9.5px] font-extrabold text-neutral-900 uppercase">
              {companyName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
