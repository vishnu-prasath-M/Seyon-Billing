"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import QuotationDocument, { DocumentData } from "@/components/QuotationDocument";
import { downloadPdfFile } from "@/lib/pdf-share";
import { LoadingState } from "@/components/ui";

export default function PublicBillViewPage() {
  const params = useParams();
  const id = params?.id as string;
  const docRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/public/bills/${id}`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Invoice not found or expired");
        return res.json();
      })
      .then((data) => {
        setBill(data.bill);
        setSettings(data.settings);
      })
      .catch((err) => {
        setError(err.message || "Failed to load invoice");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleDownload = async () => {
    if (!docRef.current || !bill) return;
    setIsDownloading(true);
    try {
      const fileName = `${bill.invoiceNumber || "Invoice"}.pdf`;
      await downloadPdfFile(docRef.current, fileName);
    } catch (err) {
      console.error("PDF download error:", err);
      window.print();
    } finally {
      setIsDownloading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <LoadingState message="Loading official invoice..." />
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-md max-w-md w-full text-center border border-slate-200">
          <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 font-bold text-xl">
            !
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Invoice Not Available</h2>
          <p className="text-sm text-slate-500 mb-6">
            {error || "The requested invoice could not be found."}
          </p>
        </div>
      </div>
    );
  }

  const documentData: DocumentData = {
    type: "invoice",
    number: bill.invoiceNumber,
    date: bill.invoiceDate,
    status: bill.status,
    counterName: bill.counter?.name,
    createdByName: bill.createdBy?.name,
    customer: {
      name: bill.customerSnapshot?.name || bill.customerName || "Customer",
      phone: bill.customerSnapshot?.phone || bill.customerPhone,
      email: bill.customerSnapshot?.email || bill.customerEmail,
      address: bill.customerSnapshot?.address || bill.customerAddress,
      city: bill.customerSnapshot?.city || bill.customerCity,
      state: bill.customerSnapshot?.state || bill.customerState,
      gstin: bill.customerSnapshot?.gstin || bill.customerGstin,
      placeOfSupply: bill.customerSnapshot?.placeOfSupply || bill.placeOfSupply,
    },
    items: (bill.items || []).map((it: any) => ({
      productName: it.productName,
      productCode: it.productCode,
      hsnSac: it.hsnSac,
      quantity: Number(it.quantity),
      unit: it.unit,
      mrp: it.mrp ? Number(it.mrp) : undefined,
      rate: Number(it.rate),
      discountPercent: it.discountPercent ? Number(it.discountPercent) : 0,
      discountAmount: it.discountAmount ? Number(it.discountAmount) : 0,
      taxableAmount: Number(it.taxableAmount),
      gstPercent: Number(it.gstPercent),
      cgstAmount: Number(it.cgstAmount),
      sgstAmount: Number(it.sgstAmount),
      igstAmount: Number(it.igstAmount),
      totalAmount: Number(it.amount || 0),
    })),
    subtotal: Number(bill.subtotal),
    discountAmount: Number(bill.discountAmount || 0),
    taxableAmount: Number(bill.taxableAmount),
    cgstAmount: Number(bill.cgstAmount || 0),
    sgstAmount: Number(bill.sgstAmount || 0),
    igstAmount: Number(bill.igstAmount || 0),
    grandTotal: Number(bill.grandTotal),
    notes: bill.notes,
    settings: settings || undefined,
  };

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 print:bg-white print:p-0">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 py-3 shadow-xs print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-[#087ea4] block">
              Seyon UPVC Windows & Doors
            </span>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 leading-tight">
              Tax Invoice #{bill.invoiceNumber}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownload}
              disabled={isDownloading}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#087ea4] hover:bg-[#076b8b] text-white rounded-lg shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                />
              </svg>
              <span>{isDownloading ? "Generating PDF..." : "Download PDF"}</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="hidden sm:inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Print
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-2 sm:p-6 print:p-0">
        <div className="bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden print:shadow-none print:border-none">
          <div ref={docRef}>
            <QuotationDocument data={documentData} />
          </div>
        </div>
      </main>
    </div>
  );
}
