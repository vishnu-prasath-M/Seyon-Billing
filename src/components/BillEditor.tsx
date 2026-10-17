"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CustomerSelector, { Customer } from "./CustomerSelector";
import LineItemsEditor, { LineItem, calcItem } from "./LineItemsEditor";
import TotalsSection, { computeTotals } from "./TotalsSection";
import QuotationDocument, { DocumentData } from "./QuotationDocument";
import { Toast, useToast } from "./ui";

export default function BillEditor() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromQuotationId = searchParams.get("fromQuotation");
  const { toast, showToast, hideToast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [invoiceNumber, setInvoiceNumber] = useState<string>("");
  const [invoiceDate, setInvoiceDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [paymentStatus, setPaymentStatus] = useState<"PAID" | "PARTIAL" | "UNPAID">("PAID");
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [enableGst, setEnableGst] = useState<boolean>(false);
  const [isInterState, setIsInterState] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>("");
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

  // Load next invoice number & settings
  useEffect(() => {
    fetch("/api/bills/next-number")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.nextNumber) setInvoiceNumber(data.nextNumber);
      })
      .catch(() => {});

    fetch("/api/settings")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.settings) setSettings(data.settings);
      })
      .catch(() => {});

    // If prefilling from quotation
    if (fromQuotationId) {
      fetch(`/api/quotations/${fromQuotationId}`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.quotation) {
            const q = data.quotation;
            const snap = q.customerSnapshot || {};
            setCustomer({
              id: q.customerId || "",
              name: snap.name || q.customerName || "",
              phone: snap.phone || q.customerPhone || "",
              email: snap.email || q.customerEmail || "",
              address: snap.address || q.customerAddress || "",
              city: snap.city || q.customerCity || "",
              state: snap.state || q.customerState || "",
              gstin: snap.gstin || q.customerGstin || "",
              placeOfSupply: snap.placeOfSupply || q.placeOfSupply || "",
            });
            if (q.notes) setNotes(q.notes);

            const hasTax = (q.items || []).some((it: any) => Number(it.gstPercent) > 0);
            if (hasTax) setEnableGst(true);

            const mappedItems: LineItem[] = (q.items || []).map((it: any) => ({
              _key: Math.random().toString(36).substring(2, 9),
              productId: it.productId || undefined,
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
              amount: Number(it.amount || it.totalAmount || 0),
            }));
            setItems(mappedItems);
          }
        })
        .catch(() => {});
    }
  }, [fromQuotationId]);

  const totals = computeTotals(items, isInterState, enableGst);

  // Sync amountPaid default when grandTotal changes if status is PAID
  useEffect(() => {
    if (paymentStatus === "PAID") {
      setAmountPaid(totals.grandTotal);
    } else if (paymentStatus === "UNPAID") {
      setAmountPaid(0);
    }
  }, [totals.grandTotal, paymentStatus]);

  const documentData: DocumentData = {
    type: "invoice",
    number: invoiceNumber || "INV-DRAFT",
    date: invoiceDate,
    status: paymentStatus,
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

  const handleSaveBill = async () => {
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
      const res = await fetch("/api/bills", {
        method: "POST",
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
          invoiceDate: new Date(invoiceDate).toISOString(),
          paymentMode: "CASH",
          status: paymentStatus,
          amountPaid: paymentStatus === "PAID" ? totals.grandTotal : amountPaid,
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
        showToast(data.error || "Failed to generate bill", "error");
        setIsSubmitting(false);
        return;
      }

      showToast("Bill generated successfully!", "success");
      setTimeout(() => {
        router.push(`/bills/${data.bill?.id || data.id}`);
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
          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Create Tax Invoice</h1>
          <p className="text-xs text-slate-500 mt-1">
            Fast billing counter workflow with automated GST calculations
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="px-3.5 py-2 text-xs font-semibold border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs transition-colors"
          >
            {showPreview ? "Hide Preview" : "Invoice Preview"}
          </button>
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSaveBill}
            className="px-5 py-2 text-xs font-bold bg-[#087ea4] text-white rounded-lg hover:bg-[#076b8b] disabled:opacity-50 cursor-pointer shadow-sm transition-all"
          >
            {isSubmitting ? "Generating..." : "Generate Invoice"}
          </button>
        </div>
      </div>

      {showPreview && (
        <div className="bg-slate-100 p-6 md:p-8 rounded-2xl border border-slate-300 mb-6 overflow-x-auto shadow-inner">
          <div className="max-w-[850px] mx-auto mb-4 flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Tax Invoice View
            </span>
            <span className="text-[11px] text-slate-500 font-medium">Exact print & PDF reproduction</span>
          </div>
          <div className="shadow-2xl rounded-sm overflow-hidden max-w-[850px] mx-auto ring-1 ring-black/5 bg-white">
            <QuotationDocument data={documentData} />
          </div>
        </div>
      )}

      {/* Invoice Meta Row with GST ON/OFF Slider Button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 bg-white border border-slate-200/90 rounded-xl text-xs shadow-xs items-center">
        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Invoice Number</label>
          <input
            type="text"
            readOnly
            value={invoiceNumber || "Generating..."}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-md text-slate-700 font-mono font-bold"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-1.5">Invoice Date</label>
          <input
            type="date"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          />
        </div>

        {/* GST On / Off Slider Switch with Smooth Transition */}
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

            {/* Slider Switch */}
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
          <label className="block text-slate-700 font-semibold mb-1.5">Payment Status</label>
          <select
            value={paymentStatus}
            onChange={(e) => setPaymentStatus(e.target.value as any)}
            className="w-full px-3 py-2 border border-slate-300 rounded-md text-slate-800 bg-white focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
          >
            <option value="PAID">Paid in Full</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </div>
      </div>

      {paymentStatus === "PARTIAL" && (
        <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-xs flex items-center gap-4">
          <span className="font-bold text-amber-900">Paid Amount (₹):</span>
          <input
            type="number"
            value={amountPaid}
            onChange={(e) => setAmountPaid(Number(e.target.value))}
            className="w-36 px-3 py-1.5 bg-white border border-amber-300 rounded-md font-mono font-bold"
          />
          <span className="text-amber-800">
            Balance Due: <strong className="font-mono text-sm">₹{Math.max(0, totals.grandTotal - amountPaid).toFixed(2)}</strong>
          </span>
        </div>
      )}

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
              Invoice Notes (Optional)
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Dispatched via vehicle TN-38-AB-1234. Delivered in good condition."
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
