"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import QuotationDocument, { DocumentData } from "@/components/QuotationDocument";
import { LoadingState, Toast, useToast, ConfirmDialog } from "@/components/ui";

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

  const handleDownloadPdf = () => {
    window.open(`/api/quotations/${id}/pdf`, "_blank");
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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 print:hidden">
        <div className="flex items-center gap-3.5">
          <Link
            href="/quotations"
            className="text-xs text-slate-700 hover:text-slate-900 border border-slate-300 rounded-lg px-3 py-1.5 hover:bg-slate-50 font-semibold shadow-2xs transition-colors"
          >
            ← Back
          </Link>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
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
            <p className="text-xs text-slate-400 mt-0.5">
              Terminal: <span className="font-semibold text-slate-700">{quotation.counter?.name}</span> • Created by: {quotation.user?.name || quotation.createdBy?.name}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {quotation.status !== "CONVERTED" ? (
            <button
              type="button"
              disabled={isConverting}
              onClick={() => setShowConvertConfirm(true)}
              className="px-4 py-2 text-xs font-bold bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 disabled:opacity-50 cursor-pointer shadow-sm transition-all"
            >
              {isConverting ? "Converting..." : "Convert to Bill"}
            </button>
          ) : (
            <span className="text-xs text-purple-700 font-bold px-3 py-1.5 bg-purple-50 rounded-lg border border-purple-200">
              Converted to Bill
            </span>
          )}

          <button
            type="button"
            onClick={handleDownloadPdf}
            className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
          >
            Download / View PDF
          </button>
          <button
            type="button"
            onClick={handlePrint}
            className="px-5 py-2 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] cursor-pointer shadow-sm transition-all"
          >
            Print Quotation
          </button>
        </div>
      </div>

      {/* A4 Document View on Canvas */}
      <div className="py-6 px-2 sm:px-6 bg-slate-100/70 rounded-2xl border border-slate-200/90 print:bg-white print:border-none print:p-0 flex justify-center">
        <div className="shadow-xl ring-1 ring-black/5 bg-white rounded-sm w-full max-w-[850px] overflow-hidden">
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
