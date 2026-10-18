"use client";
import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QuotationDocument, { DocumentData } from "@/components/QuotationDocument";
import { LoadingState, Toast, useToast, ConfirmDialog } from "@/components/ui";
import { sharePdfFile, downloadPdfFile } from "@/lib/pdf-share";

export default function QuotationViewPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const { toast, showToast, hideToast } = useToast();

  const [loading, setLoading] = useState<boolean>(true);
  const [quotation, setQuotation] = useState<any>(null);
  const [settings, setSettings] = useState<any>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [showConvertConfirm, setShowConvertConfirm] = useState<boolean>(false);
  const [isSharing, setIsSharing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      fetch(`/api/quotations/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch("/api/settings").then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([qData, sData]) => {
        if (qData?.quotation) {
          setQuotation(qData.quotation);
        }
        if (sData?.settings) {
          setSettings(sData.settings);
        }
      })
      .catch((err) => {
        showToast("Error loading quotation", "error");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPdf = async () => {
    if (!docRef.current) {
      window.open(`/api/quotations/${id}/pdf`, "_blank");
      return;
    }
    setIsDownloading(true);
    try {
      const fileName = `${quotation.quotationNumber || "Quotation"}.pdf`;
      await downloadPdfFile(docRef.current, fileName);
      showToast("PDF downloaded successfully!", "success");
    } catch {
      window.open(`/api/quotations/${id}/pdf`, "_blank");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleSharePdf = async () => {
    if (!docRef.current || !quotation) return;
    setIsSharing(true);
    try {
      const fileName = `${quotation.quotationNumber || "Quotation"}.pdf`;
      const custName = quotation.customerSnapshot?.name || quotation.customerName || "Customer";
      const phone = quotation.customerSnapshot?.phone || quotation.customerPhone || "";
      const dateStr = quotation.createdAt || quotation.quotationDate
        ? new Date(quotation.createdAt || quotation.quotationDate).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
          })
        : "";

      const text = `*SEYON UPVC WINDOWS & DOORS*\n📋 *Quotation / Estimate:* ${quotation.quotationNumber}\n👤 *Customer:* ${custName}\n📅 *Date:* ${dateStr}\n💰 *Grand Total:* ₹${Number(quotation.grandTotal).toFixed(2)}\n⏳ *Validity:* ${quotation.expiryDays || 15} Days\n\nThank you for choosing Seyon UPVC! Please find your quotation attached.`;

      const publicUrl = typeof window !== "undefined" ? `${window.location.origin}/view/quotation/${id}` : "";

      await sharePdfFile({
        element: docRef.current,
        fileName,
        title: `${quotation.quotationNumber} - Seyon UPVC`,
        text,
        phone,
        publicUrl,
        onSuccess: (msg) => showToast(msg, "success"),
        onError: (err) => {
          console.error("PDF share error:", err);
          showToast("Opening WhatsApp with quotation link...", "info");
        },
      });
    } catch (err: any) {
      console.error("PDF share error:", err);
      showToast("Opening WhatsApp...", "info");
    } finally {
      setIsSharing(false);
    }
  };

  const handleConvert = async () => {
    setIsConverting(true);
    setShowConvertConfirm(false);
    try {
      const res = await fetch(`/api/quotations/${id}/convert`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to convert quotation to bill", "error");
        setIsConverting(false);
        return;
      }
      showToast("Quotation converted to Bill successfully!", "success");
      setTimeout(() => {
        router.push(`/bills/${data.bill.id}`);
      }, 700);
    } catch (e) {
      showToast("Network error while converting quotation", "error");
      setIsConverting(false);
    }
  };

  if (loading) {
    return <LoadingState message="Loading quotation details..." />;
  }

  if (!quotation) {
    return (
      <div className="p-12 text-center bg-white border border-slate-200 rounded-xl shadow-xs">
        <p className="text-slate-600 mb-4 font-medium">Quotation not found or unauthorized.</p>
        <Link href="/quotations" className="text-xs text-[#087ea4] font-bold underline">
          ← Back to Quotations Directory
        </Link>
      </div>
    );
  }

  const documentData: DocumentData = {
    type: "quotation",
    number: quotation.quotationNumber,
    date: quotation.createdAt || quotation.quotationDate,
    expiryDate: quotation.expiryDate,
    status: quotation.status,
    counterName: quotation.counter?.name,
    createdByName: quotation.createdBy?.name || quotation.user?.name,
    customer: {
      name: quotation.customerSnapshot?.name || quotation.customerName || "Customer",
      phone: quotation.customerSnapshot?.phone || quotation.customerPhone,
      email: quotation.customerSnapshot?.email || quotation.customerEmail,
      address: quotation.customerSnapshot?.address || quotation.customerAddress,
      city: quotation.customerSnapshot?.city || quotation.customerCity,
      state: quotation.customerSnapshot?.state || quotation.customerState,
      gstin: quotation.customerSnapshot?.gstin || quotation.customerGstin,
      placeOfSupply: quotation.customerSnapshot?.placeOfSupply || quotation.placeOfSupply,
    },
    salesPerson: quotation.salesPerson,
    items: (quotation.items || []).map((it: any) => ({
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
    subtotal: Number(quotation.subtotal),
    discountAmount: Number(quotation.discountAmount),
    taxableAmount: Number(quotation.taxableAmount),
    cgstAmount: Number(quotation.cgstAmount),
    sgstAmount: Number(quotation.sgstAmount),
    igstAmount: Number(quotation.igstAmount),
    roundOff: Number(quotation.roundOff || 0),
    grandTotal: Number(quotation.grandTotal),
    notes: quotation.notes,
    settings: settings,
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Action Bar (Hidden on print) */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-3.5">
          <Link
            href="/quotations"
            className="text-xs text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 font-semibold shadow-2xs transition-colors shrink-0"
          >
            ← Back
          </Link>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-mono">
                {quotation.quotationNumber}
              </h1>
              <span
                className={`text-[10px] uppercase font-bold px-2.5 py-0.5 rounded-full border ${
                  quotation.status === "CONVERTED"
                    ? "bg-purple-50 text-purple-700 border-purple-200"
                    : quotation.status === "ACCEPTED"
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                    : quotation.status === "SENT"
                    ? "bg-blue-50 text-blue-700 border-blue-200"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                {quotation.status}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Created by: <span className="font-semibold text-slate-700">{quotation.user?.name || quotation.createdBy?.name}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {quotation.status !== "CONVERTED" ? (
            <button
              type="button"
              disabled={isConverting}
              onClick={() => setShowConvertConfirm(true)}
              className="px-3.5 py-1.5 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            >
              {isConverting ? "Converting..." : "Convert to Bill"}
            </button>
          ) : (
            <span className="text-xs text-purple-700 font-bold px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
              Converted to Bill
            </span>
          )}

          {/* SHARE ON WHATSAPP BUTTON */}
          <button
            type="button"
            disabled={isSharing}
            onClick={handleSharePdf}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            title="Share PDF quotation on WhatsApp"
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

      {/* A4 Document View on Canvas */}
      <div className="py-4 sm:py-6 px-1 sm:px-6 bg-slate-100/70 rounded-2xl border border-slate-200/90 print:bg-white print:border-none print:p-0 flex justify-center overflow-x-auto">
        <div ref={docRef} className="shadow-xl ring-1 ring-black/5 bg-white rounded-sm w-full max-w-[850px] overflow-hidden">
          <QuotationDocument data={documentData} />
        </div>
      </div>

      <ConfirmDialog
        isOpen={showConvertConfirm}
        title="Convert Quotation to Bill?"
        message={`Are you sure you want to convert quotation ${quotation.quotationNumber} into an official Tax Invoice? All line items, rates, and customer details will be copied into a new bill.`}
        confirmText="Yes, Convert to Bill"
        onConfirm={handleConvert}
        onCancel={() => setShowConvertConfirm(false)}
      />
    </div>
  );
}
