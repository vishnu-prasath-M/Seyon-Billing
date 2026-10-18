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
    if (!docRef.current || !bill) return;
    setIsSharing(true);
    try {
      const fileName = `${bill.invoiceNumber || "Invoice"}.pdf`;
      const custName = bill.customerSnapshot?.name || bill.customerName || "Customer";
      const phone = bill.customerSnapshot?.phone || bill.customerPhone || "";
      const dateStr = bill.invoiceDate
        ? new Date(bill.invoiceDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";

      const text = `*SEYON UPVC WINDOWS & DOORS*\n📄 *Tax Invoice:* ${bill.invoiceNumber}\n👤 *Customer:* ${custName}\n📅 *Date:* ${dateStr}\n💰 *Grand Total:* ₹${Number(bill.grandTotal).toFixed(2)}\n✅ *Status:* ${bill.status === "PAID" ? "Paid in Full" : bill.status}\n\nThank you for choosing Seyon UPVC! Please find your invoice attached.`;

      const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/view/bill/${id}` : "";

      await sharePdfFile({
        element: docRef.current,
        fileName,
        title: `${bill.invoiceNumber} - Seyon UPVC`,
        text,
        phone,
        publicUrl,
        onSuccess: (msg) => showToast(msg, "success"),
        onError: (err) => {
          console.error("PDF share error:", err);
          showToast("Opening WhatsApp with invoice link...", "info");
        },
      });
    } catch (err: any) {
      console.error("PDF share error:", err);
      showToast("Opening WhatsApp...", "info");
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

          {/* SHARE ON WHATSAPP BUTTON */}
          <button
            type="button"
            disabled={isSharing}
            onClick={handleSharePdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            title="Share PDF invoice on WhatsApp"
          >
            <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
              <path d="M12.031 2C6.516 2 2.016 6.5 2.016 12.016c0 1.953.563 3.844 1.625 5.469L2 22l4.672-1.594A9.97 9.97 0 0 0 12.031 22C17.547 22 22 17.5 22 12.016 22 6.5 17.547 2 12.031 2Zm-.016 17.656c-1.688 0-3.328-.484-4.734-1.39l-.344-.219-2.781.953.953-2.703-.234-.375a8.03 8.03 0 0 1-1.328-4.406c0-4.469 3.64-8.109 8.125-8.109 4.469 0 8.109 3.64 8.109 8.109 0 4.484-3.64 8.14-8.109 8.14Zm4.516-6.14c-.25-.125-1.469-.719-1.688-.813-.234-.078-.406-.125-.578.125-.172.25-.672.828-.828 1-.156.172-.313.203-.563.078-.25-.125-1.063-.39-2.031-1.25a7.74 7.74 0 0 1-1.406-1.734c-.156-.25 0-.39.109-.531.11-.125.25-.313.375-.469.125-.156.172-.266.25-.438.078-.172.047-.328-.016-.453-.063-.125-.578-1.39-.797-1.906-.219-.5-.438-.438-.594-.438h-.5c-.172 0-.453.063-.688.313-.234.25-.906.89-.906 2.172 0 1.281.938 2.516 1.063 2.688.125.172 1.844 2.813 4.469 3.953.625.266 1.109.438 1.484.563.625.203 1.203.172 1.656.109.5-.078 1.469-.609 1.688-1.203.203-.594.203-1.094.141-1.203-.063-.11-.234-.172-.484-.297Z" />
            </svg>
            <span>{isSharing ? "Preparing..." : "Share on WhatsApp"}</span>
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
        <span>Tap <strong>Share on WhatsApp</strong> to send PDF</span>
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
