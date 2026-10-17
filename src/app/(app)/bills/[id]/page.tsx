"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QuotationDocument, { DocumentData } from "@/components/QuotationDocument";
import ThermalReceipt from "@/components/ThermalReceipt";
import { LoadingState, Toast, useToast } from "@/components/ui";
import { sharePdfFile, downloadPdfFile } from "@/lib/pdf-share";

export default function BillViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [bill, setBill] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"A4" | "THERMAL">("A4");
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/bills/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/settings").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([bData, sData]) => {
        if (bData?.bill) {
          setBill(bData.bill);
        }
        if (sData?.settings) {
          setSettings(sData.settings);
        }
      })
      .catch((err) => {
        showToast("Error loading bill", "error");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current) {
      window.open(`/api/bills/${id}/pdf`, "_blank");
      return;
    }
    setIsDownloading(true);
    try {
      const fileName = `${bill.invoiceNumber || "Invoice"}.pdf`;
      await downloadPdfFile(docRef.current, fileName);
      showToast("PDF downloaded successfully!", "success");
    } catch {
      window.open(`/api/bills/${id}/pdf`, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSharePdf = async () => {
    if (!docRef.current) return;
    setIsSharing(true);
    try {
      const fileName = `${bill.invoiceNumber || "Invoice"}.pdf`;
      await sharePdfFile({
        element: docRef.current,
        fileName,
        title: `${bill.invoiceNumber} - Seyon UPVC`,
        text: `Tax Invoice ${bill.invoiceNumber} for ${bill.customerSnapshot?.name || "Customer"} - Total: ₹${bill.grandTotal}`,
        onSuccess: (msg) => showToast(msg, "success"),
        onError: () => showToast("Could not share PDF", "error"),
      });
    } catch {
      showToast("Could not share PDF", "error");
    } finally {
      setIsSharing(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading invoice details..." />;
  }

  if (!bill) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
        <p className="text-slate-600 mb-4 font-medium">Invoice not found or unauthorized.</p>
        <Link href="/bills" className="text-xs text-[#087ea4] font-bold underline">
          ← Back to Billing Directory
        </Link>
      </div>
    );
  }

  const documentData: DocumentData = {
    type: "invoice",
    number: bill.invoiceNumber,
    date: bill.invoiceDate,
    status: bill.status,
    counterName: bill.counter?.name,
    createdByName: bill.createdBy?.name || bill.user?.name,
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
      totalAmount: Number(it.amount || it.totalAmount || 0),
    })),
    subtotal: Number(bill.subtotal),
    discountAmount: Number(bill.discountAmount),
    taxableAmount: Number(bill.taxableAmount),
    cgstAmount: Number(bill.cgstAmount),
    sgstAmount: Number(bill.sgstAmount),
    igstAmount: Number(bill.igstAmount),
    roundOff: Number(bill.roundOff || 0),
    grandTotal: Number(bill.grandTotal),
    notes: bill.notes,
    settings: settings,
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Action Bar (Hidden on print) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-3.5">
          <Link
            href="/bills"
            className="text-xs text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 font-semibold shadow-2xs transition-colors shrink-0"
          >
            ← Back
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-mono">
                {bill.invoiceNumber}
              </h1>
              <span
                className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  bill.status === "PAID"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : bill.status === "PARTIAL"
                    ? "bg-amber-50 text-amber-700 border-amber-200"
                    : "bg-rose-50 text-rose-700 border-rose-200"
                }`}
              >
                {bill.status} ({bill.paymentMode || "CASH"})
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Billed by: <span className="font-semibold text-slate-700">{bill.createdBy?.name || bill.user?.name}</span>
              {bill.convertedFromQuotationId && (
                <span className="ml-2 text-purple-700 font-semibold">
                  • Converted from Quotation
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Format toggle */}
          <div className="flex rounded-lg border border-slate-300 overflow-hidden text-xs bg-white shadow-2xs">
            <button
              type="button"
              onClick={() => setViewMode("A4")}
              className={`px-3 py-1.5 font-bold transition-colors cursor-pointer ${
                viewMode === "A4" ? "bg-[#087ea4] text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              A4 Format
            </button>
            <button
              type="button"
              onClick={() => setViewMode("THERMAL")}
              className={`px-3 py-1.5 font-bold transition-colors cursor-pointer ${
                viewMode === "THERMAL" ? "bg-[#087ea4] text-white" : "text-slate-700 hover:bg-slate-50"
              }`}
            >
              80mm Thermal
            </button>
          </div>

          {/* SHARE PDF BUTTON */}
          <button
            type="button"
            disabled={isSharing}
            onClick={handleSharePdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            title="Share PDF directly to WhatsApp, Email or another device"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
            {isSharing ? "Sharing..." : "Share PDF"}
          </button>

          <button
            type="button"
            disabled={isDownloading}
            onClick={handleDownloadPdf}
            className="px-3.5 py-1.5 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
          >
            {isDownloading ? "Downloading..." : "Download PDF"}
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="px-4 py-1.5 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] cursor-pointer shadow-sm transition-all"
          >
            Print
          </button>
        </div>
      </div>

      {/* Mobile helper notice */}
      <div className="sm:hidden -mt-2 mb-1 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
        <span>💡 Mobile View</span>
        <span>Tap <strong>Share PDF</strong> or scroll table ↔</span>
      </div>

      {/* Render selected format */}
      <div className="py-4 sm:py-6 px-1 sm:px-6 bg-slate-100/70 rounded-2xl border border-slate-200/90 print:bg-white print:border-none print:p-0 flex justify-center overflow-x-auto">
        <div ref={docRef} className="shadow-xl ring-1 ring-black/5 bg-white rounded-sm w-full max-w-[850px] overflow-hidden">
          {viewMode === "A4" ? (
            <QuotationDocument data={documentData} />
          ) : (
            <ThermalReceipt data={documentData} />
          )}
        </div>
      </div>
    </div>
  );
}
