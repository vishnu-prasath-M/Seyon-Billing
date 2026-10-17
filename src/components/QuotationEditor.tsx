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
  const [enableGst, setEnableGst] = useState<boolean>(false);
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [items, setItems] = useState<LineItem[]>([]);
  const [settings, setSettings] = useState<any>(null);
  const [showPreview, setShowPreview] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleGstToggle = (checked: boolean) => {
    setEnableGst(checked);
    setItems((prev) => prev.map((item) => calcItem(item, isInterState, checked)));
  };

  const handleInterStateChange = (checked: boolean) => {
    setIsInterState(checked);
    setItems((prev) => prev.map((item) => calcItem(item, checked, enableGst)));
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

    if (initialData) {
      setQuotationNumber(initialData.quotationNumber || "");
      if (initialData.quotationDate) {
        setQuotationDate(
          new Date(initialData.quotationDate).toISOString().split("T")[0]
        );
      }
      if (initialData.expiryDate && initialData.quotationDate) {
        const diff =
          (new Date(initialData.expiryDate).getTime() -
            new Date(initialData.quotationDate).getTime()) /
          (1000 * 60 * 60 * 24);
        setExpiryDays(Math.max(1, Math.round(diff)));
      }
      setSalesPerson(initialData.salesPerson || "");
      setNotes(initialData.notes || "");
      if (initialData.customerSnapshot) {
        setCustomer(initialData.customerSnapshot);
      }
      if (initialData.items) {
        const hasTax = initialData.items.some((it: any) => Number(it.gstPercent) > 0);
        if (hasTax) setEnableGst(true);

        const mapped: LineItem[] = initialData.items.map((it: any) => ({
          _key: Math.random().toString(36).substring(2, 9),
          productId: it.productId,
          productName: it.productName,
          productCode: it.productCode || "",
          hsnSac: it.hsnSac || "",
          quantity: Number(it.quantity),
          unit: it.unit || "Sq.Ft",
          mrp: Number(it.mrp || 0),
          rate: Number(it.rate),
          discountPercent: Number(it.discountPercent || 0),
          discountAmount: Number(it.discountAmount || 0),
          taxableAmount: Number(it.taxableAmount),
          gstPercent: hasTax ? Number(it.gstPercent) : 0,
          gstAmount: Number(it.gstAmount || 0),
          cgstAmount: Number(it.cgstAmount || 0),
          sgstAmount: Number(it.sgstAmount || 0),
          igstAmount: Number(it.igstAmount || 0),
          amount: Number(it.totalAmount || it.amount || 0),
        }));
        setItems(mapped);
      }
    }
  }, [initialData]);

  const totals = computeTotals(items, isInterState, enableGst);

  const expiryDate = new Date(quotationDate);
  expiryDate.setDate(expiryDate.getDate() + Number(expiryDays));

  const documentData: DocumentData = {
    type: "quotation",
    number: quotationNumber || "QT-DRAFT",
    date: quotationDate,
    expiryDate: expiryDate.toISOString().split("T")[0],
    salesPerson: salesPerson || undefined,
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
    items: items.map((i) => ({
      productName: i.productName,
      productCode: i.productCode,
      hsnSac: i.hsnSac,
      quantity: i.quantity,
      unit: i.unit || "Sq.Ft",
      mrp: i.mrp,
      rate: i.rate,
      discountPercent: i.discountPercent,
      taxableAmount: i.taxableAmount,
      gstPercent: enableGst ? i.gstPercent : 0,
      cgstAmount: enableGst ? i.cgstAmount : 0,
      sgstAmount: enableGst ? i.sgstAmount : 0,
      igstAmount: enableGst ? i.igstAmount : 0,
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

  const handleSaveQuotation = async () => {
    if (!customer?.name) {
      showToast("Please enter customer name", "error");
      return;
    }
    if (items.length === 0) {
      showToast("Please add at least one product", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const url = initialData?.id
        ? `/api/quotations/${initialData.id}`
        : "/api/quotations";
      const method = initialData?.id ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: customer.id || null,
          customerName: customer.name,
          customerPhone: customer.phone,
          customerEmail: customer.email,
          customerAddress: customer.address,
          customerGstin: customer.gstin,
          placeOfSupply: customer.placeOfSupply || "33-Tamil Nadu",
          customerSnapshot: customer,
          quotationDate: new Date(quotationDate).toISOString(),
          expiryDate: expiryDate.toISOString(),
          salesPerson: salesPerson || null,
          notes: notes,
          items: items.map((i, idx) => ({
            productId: i.productId || null,
            productName: i.productName,
            productCode: i.productCode || "",
            hsnSac: i.hsnSac || "",
            quantity: i.quantity,
            unit: i.unit || "Sq.Ft",
            mrp: i.mrp,
            rate: i.rate,
            discountPercent: i.discountPercent,
            discountAmount: i.discountAmount,
            taxableAmount: i.taxableAmount,
            gstPercent: enableGst ? i.gstPercent : 0,
            gstAmount: enableGst ? i.gstAmount : 0,
            cgstAmount: enableGst ? i.cgstAmount : 0,
            sgstAmount: enableGst ? i.sgstAmount : 0,
            igstAmount: enableGst ? i.igstAmount : 0,
            totalAmount: i.amount,
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
        showToast(data.error || "Failed to save quotation", "error");
        setIsSubmitting(false);
        return;
      }

      showToast("Quotation saved successfully!", "success");
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
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
            {initialData ? "Edit Quotation" : "Create Quotation"}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Build and issue customized UPVC window & door proposals for buyers
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
          >
            {showPreview ? "Hide Preview" : "Quotation Preview"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveQuotation}
            className="px-5 py-2 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] disabled:opacity-50 cursor-pointer shadow-sm transition-all"
          >
            {isSubmitting ? "Saving..." : initialData ? "Update Quotation" : "Generate Quotation"}
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

      {/* Basic Metadata Row with GST Toggle */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white border border-slate-200/90 rounded-xl text-xs shadow-xs items-center">
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

        {/* GST On / Off Slider Switch */}
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">GST Calculation</label>
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-50 border border-slate-300 rounded-md">
            <span className="font-bold text-xs flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full transition-colors ${
                  enableGst ? "bg-emerald-500" : "bg-slate-400"
                }`}
              />
              <span className={enableGst ? "text-[#087ea4] font-black" : "text-slate-600"}>
                {enableGst ? "GST ON (18%)" : "GST OFF (0%)"}
              </span>
            </span>

            <button
              type="button"
              role="switch"
              aria-checked={enableGst}
              onClick={() => handleGstToggle(!enableGst)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${
                enableGst ? "bg-[#087ea4]" : "bg-slate-300"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ease-in-out ${
                  enableGst ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </div>
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
          enableGst={enableGst}
        />
      </div>

      {/* Interstate Switch & Notes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 bg-white border border-slate-200/90 rounded-xl space-y-4 shadow-xs">
          {enableGst && (
            <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200/60 transition-all duration-300">
              <input
                type="checkbox"
                checked={isInterState}
                onChange={(e) => handleInterStateChange(e.target.checked)}
                className="rounded border-slate-300 text-[#087ea4] focus:ring-[#087ea4] w-4 h-4 cursor-pointer"
              />
              <span>Interstate Supply (Charge IGST instead of CGST + SGST)</span>
            </label>
          )}

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
          enableGst={enableGst}
        />
      </div>
    </div>
  );
}
