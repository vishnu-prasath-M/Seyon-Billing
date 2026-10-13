"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import CustomerSelector, { Customer } from "./CustomerSelector";
import LineItemsEditor, { LineItem, calcItem } from "./LineItemsEditor";
import TotalsSection, { computeTotals } from "./TotalsSection";
import QuotationDocument, { DocumentData } from "./QuotationDocument";
import { Toast, useToast } from "./ui";

interface QuotationEditorProps {
  initialData?: any;
}

export default function QuotationEditor({ initialData }: QuotationEditorProps) {
  const router = useRouter();
  const { toast, showToast, hideToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [quotationNumber, setQuotationNumber] = useState<string>("");
  const [quotationDate, setQuotationDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [expiryDays, setExpiryDays] = useState<number>(15);
  const [salesPerson, setSalesPerson] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleInterStateChange = (checked: boolean) => {
    setIsInterState(checked);
    setItems((prev) => prev.map((item) => calcItem(item, checked)));
  };

  const handleCustomerChange = (c: Customer | null) => {
    setCustomer(c);
    if (c?.placeOfSupply && !c.placeOfSupply.startsWith("33")) {
      handleInterStateChange(true);
    }
  };

  useEffect(() => {
    fetch("/api/quotations/next-number")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nextNumber) setQuotationNumber(data.nextNumber);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) {
          setSettings(data.settings);
          if (data.settings.quotationValidity) {
            setExpiryDays(data.settings.quotationValidity);
          }
        }
      })
      .catch(() => {});
  }, []);

  const expiryDate = new Date(
    new Date(quotationDate).getTime() + expiryDays * 24 * 60 * 60 * 1000
  )
    .toISOString()
    .split("T")[0];

  const totals = computeTotals(items, isInterState);

  const documentData: DocumentData = {
    type: "quotation",
    number: quotationNumber || "QT-DRAFT",
    date: quotationDate,
    expiryDate: expiryDate,
    customer: {
      name: customer?.name || "Customer Name",
      phone: customer?.phone,
      email: customer?.email,
      address: customer?.address,
      city: customer?.city,
      state: customer?.state,
      gstin: customer?.gstin,
      placeOfSupply: customer?.placeOfSupply,
    },
    salesPerson: salesPerson,
    items: items.map((i) => ({
      productName: i.productName,
      productCode: i.productCode,
      hsnSac: i.hsnSac,
      quantity: i.quantity,
      unit: i.unit,
      mrp: i.mrp,
      rate: i.rate,
      discountPercent: i.discountPercent,
      taxableAmount: i.taxableAmount,
      gstPercent: i.gstPercent,
      cgstAmount: i.cgstAmount,
      sgstAmount: i.sgstAmount,
      igstAmount: i.igstAmount,
      totalAmount: i.amount,
    })),
    subtotal: totals.subtotal,
    discountAmount: totals.discountAmount,
    taxableAmount: totals.taxableAmount,
    cgstAmount: totals.cgstAmount,
    sgstAmount: totals.sgstAmount,
    igstAmount: totals.igstAmount,
    grandTotal: totals.grandTotal,
    notes: notes,
    settings: settings,
  };

  const handleSave = async (status: "DRAFT" | "SENT" | "ACCEPTED" = "DRAFT") => {
    if (!customer?.name) {
      showToast("Please enter customer name or select a customer", "error");
      return;
    }
    if (items.length === 0) {
      showToast("Please add at least one line item", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id || null,
          customerSnapshot: {
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
            city: customer.city,
            state: customer.state,
            gstin: customer.gstin,
            placeOfSupply: customer.placeOfSupply,
          },
          quotationDate: new Date(quotationDate).toISOString(),
          expiryDate: new Date(expiryDate).toISOString(),
          salesPerson: salesPerson || null,
          placeOfSupply: customer.placeOfSupply || "33-Tamil Nadu",
          notes: notes || null,
          status: status,
          items: items.map((i, idx) => ({
            productId: i.productId || null,
            productName: i.productName,
            productCode: i.productCode,
            hsnSac: i.hsnSac,
            quantity: i.quantity,
            unit: i.unit,
            mrp: i.mrp,
            rate: i.rate,
            discountPercent: i.discountPercent,
            discountAmount: i.discountAmount,
            taxableAmount: i.taxableAmount,
            gstPercent: i.gstPercent,
            gstAmount: i.gstAmount,
            cgstAmount: i.cgstAmount,
            sgstAmount: i.sgstAmount,
            igstAmount: i.igstAmount,
            amount: i.amount,
            sortOrder: idx,
          })),
          subtotal: totals.subtotal,
          discountAmount: totals.discountAmount,
          taxableAmount: totals.taxableAmount,
          cgstAmount: totals.cgstAmount,
          sgstAmount: totals.sgstAmount,
          igstAmount: totals.igstAmount,
          grandTotal: totals.grandTotal,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to create quotation", "error");
        setIsSubmitting(false);
        return;
      }

      showToast("Quotation created successfully!", "success");
      setTimeout(() => {
        router.push(`/quotations/${data.quotation?.id || data.id}`);
      }, 700);
    } catch {
      showToast("Network error. Please try again.", "error");
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Create Quotation</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate official estimate matching Seyon UPVC Quotation layout
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
          >
            {showPreview ? "Hide Preview" : "Show PDF Preview"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave("DRAFT")}
            className="px-4 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer shadow-2xs transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={() => handleSave("SENT")}
            className="px-5 py-2 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] disabled:opacity-50 cursor-pointer shadow-sm transition-all"
          >
            {isSubmitting ? "Generating..." : "Save & View Quotation"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-slate-100 p-6 md:p-8 rounded-2xl border border-slate-300 mb-6 overflow-x-auto shadow-inner">
          <div className="max-w-[850px] mx-auto mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Document View
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Exact print & PDF reproduction</span>
          </div>
          <div className="shadow-2xl rounded-sm overflow-hidden max-w-[850px] mx-auto ring-1 ring-black/5 bg-white">
            <QuotationDocument data={documentData} />
          </div>
        </div>
      )}

      {/* Basic Metadata Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white border border-slate-200/90 rounded-xl text-xs shadow-xs">
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Quotation Number</label>
          <input
            type="text"
            readOnly
            value={quotationNumber || "Generating..."}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono font-bold"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Quotation Date</label>
          <input
            type="date"
            value={quotationDate}
            onChange={(e) => setQuotationDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Validity (Days)</label>
          <input
            type="number"
            min={1}
            max={90}
            value={expiryDays}
            onChange={(e) => setExpiryDays(Number(e.target.value))}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Sales Person (Optional)</label>
          <input
            type="text"
            placeholder="e.g. 10025 or Anand"
            value={salesPerson}
            onChange={(e) => setSalesPerson(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>
      </div>

      {/* Customer Selection */}
      <CustomerSelector
        value={customer}
        onChange={handleCustomerChange}
      />

      {/* Line Items Table */}
      <div className="bg-white border border-slate-200/90 rounded-xl p-5 shadow-xs">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-3">
          Order Items & Pricing
        </h3>
        <LineItemsEditor
          items={items}
          onChange={setItems}
          isInterState={isInterState}
        />
      </div>

      {/* Interstate Switch & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 shadow-xs">
          <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/60">
            <input
              type="checkbox"
              checked={isInterState}
              onChange={(e) => handleInterStateChange(e.target.checked)}
              className="rounded border-slate-300 text-[#087ea4] focus:ring-[#087ea4] w-4 h-4 cursor-pointer"
            />
            <span>Interstate Supply (Charge IGST instead of CGST + SGST)</span>
          </label>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Customer Notes / Special Terms (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Glass specification 5mm toughened, delivery at site included."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md text-slate-800 focus:outline-none focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4]"
            />
          </div>
        </div>

        <TotalsSection
          totals={totals}
          isInterState={isInterState}
        />
      </div>
    </div>
  );
}
