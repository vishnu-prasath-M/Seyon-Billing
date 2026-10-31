"use client";
import { useState, useEffect } from "react";
import { LoadingState, Toast, useToast } from "@/components/ui";

export default function SettingsPage() {
  const { toast, showToast, hideToast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  const [activeTab, setActiveTab] = useState<"company" | "quotation" | "billing">("company");

  const [settings, setSettings] = useState({
    companyName: "SEYON UPVC",
    tagline: "Quality UPVC Windows, Doors & Hardware Solutions",
    address: "SF No 245, Avinashi Road, Civil Aerodrome Post",
    city: "Coimbatore",
    state: "Tamil Nadu",
    pincode: "641014",
    phone: "+91 98422 12345",
    email: "",
    website: "",
    gstin: "33AABCS1234A1Z5",
    pan: "AABCS1234A",
    invoicePrefix: "INV-",
    quotationPrefix: "QT-",
    quotationExpiryDays: 15,
    bankName: "State Bank of India",
    bankAccountNo: "38920192831",
    bankIfsc: "SBIN0001234",
    bankBranch: "Coimbatore Main Branch",
    quotationTerms:
      "1. 100 % advance for upto 3 machines / standard orders.\n2. 30% advance & 70% before load from warehouse.\n3. 100% advance for hardwares and accessories.\n4. Transportation and site unloading excluded unless specified.\n5. 15 month warranty and 2 year guarantee of PLC / profiles.\n6. If it's a bank loan 100% advance confirmation required.\n7. Delivery time- 15 days.\n8. CNC corner cleaning machine: delivery time- 25 days.",
    invoiceTerms:
      "1. Goods once sold will not be taken back or exchanged.\n2. 100% payment before load from warehouse.\n3. Transportation and site unloading excluded unless specified.\n4. 15 years warranty on UPVC profiles against discoloration.\n5. All disputes subject to local jurisdiction only.\n6. Interest @ 18% p.a. will be charged on overdue payments.",
  });

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => (r.ok ? r.json() : null))
      .then((sData) => {
        if (sData?.settings) {
          setSettings((prev) => ({ ...prev, ...sData.settings }));
        }
      })
      .catch(() => showToast("Error loading settings", "error"))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to update settings", "error");
        setIsSaving(false);
        return;
      }

      showToast("Company settings updated successfully!", "success");
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}

      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">
              Settings & Business Master
            </h1>
            {loading && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full border border-amber-200">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                Syncing with cloud...
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Configure company branding, GSTIN, bank details, quotation terms & terminal configuration
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("company")}
          className={`pb-3 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === "company"
              ? "text-[#087ea4] border-b-2 border-[#087ea4]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Company Profile & Brand
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("quotation")}
          className={`pb-3 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === "quotation"
              ? "text-[#087ea4] border-b-2 border-[#087ea4]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Quotation Configuration
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("billing")}
          className={`pb-3 cursor-pointer transition-colors whitespace-nowrap ${
            activeTab === "billing"
              ? "text-[#087ea4] border-b-2 border-[#087ea4]"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Invoice & Bank Details
        </button>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Company Tab */}
        {activeTab === "company" && (
          <div className="space-y-6">
            {/* Brand Logo Card */}
            <div className="bg-white border border-slate-200/90 rounded-xl p-6 shadow-xs flex flex-col sm:flex-row items-center gap-6">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200/80 shadow-2xs">
                <img
                  src="/seyon-logo.png"
                  alt="Seyon UPVC Logo"
                  className="h-24 w-auto object-contain drop-shadow-sm"
                />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Active Brand Logo
                </span>
                <h3 className="text-base font-black text-slate-900 mt-1">
                  Seyon UPVC Windows & Doors Brand Asset
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md">
                  This official insignia is automatically rendered on quotation documents, tax invoices, navbar headers, and authentication portals.
                </p>
              </div>
            </div>

            <div className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-4 text-xs shadow-xs">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Business Identity & Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={settings.companyName}
                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Tagline / Business Subtitle</label>
                  <input
                    type="text"
                    value={settings.tagline}
                    onChange={(e) => setSettings({ ...settings, tagline: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-slate-700 font-semibold mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={settings.address}
                    onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">City</label>
                  <input
                    type="text"
                    value={settings.city}
                    onChange={(e) => setSettings({ ...settings, city: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">State & PIN Code</label>
                  <div className="flex gap-2.5">
                    <input
                      type="text"
                      value={settings.state}
                      onChange={(e) => setSettings({ ...settings, state: e.target.value })}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                    />
                    <input
                      type="text"
                      value={settings.pincode}
                      onChange={(e) => setSettings({ ...settings, pincode: e.target.value })}
                      placeholder="PIN"
                      className="w-28 px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={settings.phone}
                    onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">GSTIN Number</label>
                  <input
                    type="text"
                    maxLength={15}
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-semibold mb-1.5">PAN Number</label>
                  <input
                    type="text"
                    maxLength={10}
                    value={settings.pan}
                    onChange={(e) => setSettings({ ...settings, pan: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quotation Tab */}
        {activeTab === "quotation" && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-4 text-xs shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Quotation Defaults & Terms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Quotation Number Prefix</label>
                <input
                  type="text"
                  value={settings.quotationPrefix}
                  onChange={(e) => setSettings({ ...settings, quotationPrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Default Validity (Days)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  value={settings.quotationExpiryDays}
                  onChange={(e) =>
                    setSettings({ ...settings, quotationExpiryDays: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Default Quotation Terms & Conditions
                </label>
                <textarea
                  rows={8}
                  value={settings.quotationTerms}
                  onChange={(e) => setSettings({ ...settings, quotationTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-sans focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === "billing" && (
          <div className="bg-white border border-slate-200/90 rounded-xl p-6 space-y-4 text-xs shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">Invoice Settings & Bank Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Invoice Number Prefix</label>
                <input
                  type="text"
                  value={settings.invoicePrefix}
                  onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Bank Name</label>
                <input
                  type="text"
                  value={settings.bankName}
                  onChange={(e) => setSettings({ ...settings, bankName: e.target.value })}
                  placeholder="e.g. State Bank of India"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Bank Account Number</label>
                <input
                  type="text"
                  value={settings.bankAccountNo}
                  onChange={(e) => setSettings({ ...settings, bankAccountNo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono font-bold focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1.5">Bank IFSC Code & Branch</label>
                <div className="flex gap-2.5">
                  <input
                    type="text"
                    value={settings.bankIfsc}
                    onChange={(e) => setSettings({ ...settings, bankIfsc: e.target.value.toUpperCase() })}
                    placeholder="IFSC"
                    className="w-36 px-3 py-2 border border-slate-300 rounded-lg font-mono uppercase focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                  <input
                    type="text"
                    value={settings.bankBranch}
                    onChange={(e) => setSettings({ ...settings, bankBranch: e.target.value })}
                    placeholder="Branch Name"
                    className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-slate-700 font-semibold mb-1.5">
                  Default Invoice Terms & Conditions
                </label>
                <textarea
                  rows={6}
                  value={settings.invoiceTerms}
                  onChange={(e) => setSettings({ ...settings, invoiceTerms: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-sans focus:border-[#087ea4] focus:ring-1 focus:ring-[#087ea4] focus:outline-none leading-relaxed"
                />
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-3">
          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-2.5 bg-[#087ea4] text-white font-bold rounded-lg hover:bg-[#076b8b] disabled:opacity-50 cursor-pointer shadow-sm text-xs transition-all"
          >
            {isSaving ? "Saving Settings..." : "Save Company Settings"}
          </button>
        </div>
      </form>
    </div>
  );
}
