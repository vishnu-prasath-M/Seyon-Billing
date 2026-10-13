"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toast, useToast } from "@/components/ui";

interface Category { id: string; name: string; }

interface ProductFormData {
  name: string;
  code: string;
  categoryId: string;
  hsnSac: string;
  unit: string;
  mrp: string;
  sellingPrice: string;
  gstPercent: string;
  description: string;
  trackStock: boolean;
  stock: string;
  isActive: boolean;
}

const defaultForm: ProductFormData = {
  name: "", code: "", categoryId: "", hsnSac: "", unit: "Nos",
  mrp: "", sellingPrice: "", gstPercent: "18", description: "",
  trackStock: false, stock: "", isActive: true,
};

const UNITS = ["Nos", "Pcs", "Kg", "Grm", "Mtr", "Sqft", "Sqm", "Ltr", "Set", "Pair", "Box", "Roll", "Sheet", "Rft"];
const GST_RATES = ["0", "5", "12", "18", "28"];

interface ProductFormProps {
  productId?: string;
  initialData?: Partial<ProductFormData> & { categoryId?: string };
  isEdit?: boolean;
}

export default function ProductForm({ productId, initialData, isEdit }: ProductFormProps) {
  const router = useRouter();
  const [form, setForm] = useState<ProductFormData>({ ...defaultForm, ...initialData });
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCategory, setNewCategory] = useState("");
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Partial<ProductFormData>>({});
  const { toast, showToast, hideToast } = useToast();

  useEffect(() => {
    fetch("/api/categories").then(r => r.json()).then(d => setCategories(d.categories || []));
  }, []);

  function setField(field: keyof ProductFormData, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
    setErrors(e => ({ ...e, [field]: undefined }));
  }

  function validate() {
    const errs: Partial<ProductFormData> = {};
    if (!form.name.trim()) errs.name = "Product name is required";
    if (!form.code.trim()) errs.code = "Product code is required";
    if (!form.sellingPrice || parseFloat(form.sellingPrice) <= 0) errs.sellingPrice = "Valid selling price required";
    if (!form.mrp || parseFloat(form.mrp) <= 0) errs.mrp = "Valid MRP required";
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    
    setSaving(true);
    try {
      let catId = form.categoryId;
      // Create new category if entered
      if (newCategory.trim()) {
        const catRes = await fetch("/api/categories", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: newCategory.trim() }),
        });
        if (catRes.ok) {
          const catData = await catRes.json();
          catId = catData.category?.id || catId;
        }
      }

      const payload = {
        name: form.name.trim(),
        code: form.code.trim().toUpperCase(),
        categoryId: catId || null,
        hsnSac: form.hsnSac.trim() || null,
        unit: form.unit,
        mrp: parseFloat(form.mrp),
        sellingPrice: parseFloat(form.sellingPrice),
        gstPercent: parseFloat(form.gstPercent),
        description: form.description.trim() || null,
        trackStock: form.trackStock,
        stock: form.trackStock && form.stock ? parseInt(form.stock) : null,
        isActive: form.isActive,
      };

      const url = isEdit ? `/api/products/${productId}` : "/api/products";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast(data.error || "Failed to save product.", "error");
      } else {
        showToast(isEdit ? "Product updated successfully." : "Product created successfully.");
        setTimeout(() => router.push("/products"), 800);
      }
    } catch {
      showToast("Network error. Please try again.", "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {toast && <Toast message={toast.message} type={toast.type} onClose={hideToast} />}
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-neutral-200">
        <div>
          <h1 className="text-xl font-bold text-neutral-900 tracking-tight">
            {isEdit ? "Edit Product" : "Add New Product"}
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Products are synchronized in real-time across all billing workstations
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors self-start sm:self-auto"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Products
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white rounded-xl border border-neutral-200/80 shadow-xs p-6 md:p-8 space-y-6">
          {/* Section: Basic Information */}
          <div>
            <h3 className="text-sm font-semibold text-neutral-900 pb-3 border-b border-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#174A5B]"></span>
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Product Name <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setField("name", e.target.value)}
                  placeholder="e.g. UPVC Casement Window 3x4"
                  className={`w-full px-3.5 py-2 text-sm border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 transition-all ${
                    errors.name ? "border-rose-400 bg-rose-50/30 focus:border-rose-500" : "border-neutral-300 focus:border-[#087ea4]"
                  }`}
                />
                {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Product Code / SKU <span className="text-rose-600">*</span>
                </label>
                <input
                  type="text"
                  value={form.code}
                  onChange={e => setField("code", e.target.value.toUpperCase())}
                  placeholder="e.g. UPVC-WIN-001"
                  className={`w-full px-3.5 py-2 text-sm font-mono border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 transition-all ${
                    errors.code ? "border-rose-400 bg-rose-50/30 focus:border-rose-500" : "border-neutral-300 focus:border-[#087ea4]"
                  }`}
                />
                {errors.code && <p className="text-[11px] text-rose-600 mt-1">{errors.code}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Category
                </label>
                <select
                  value={form.categoryId}
                  onChange={e => setField("categoryId", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 focus:border-[#087ea4] bg-white transition-all"
                >
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Create New Category (optional)
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={e => setNewCategory(e.target.value)}
                  placeholder="e.g. Sliding Profiles"
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 focus:border-[#087ea4] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  HSN / SAC Code
                </label>
                <input
                  type="text"
                  value={form.hsnSac}
                  onChange={e => setField("hsnSac", e.target.value)}
                  placeholder="e.g. 39252000"
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 focus:border-[#087ea4] transition-all"
                />
              </div>
            </div>

            <div className="mt-4">
              <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                Description / Specifications
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setField("description", e.target.value)}
                placeholder="Product specifications, size, profile brand, reinforced steel details..."
                className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 focus:border-[#087ea4] transition-all resize-y"
              />
            </div>
          </div>

          {/* Section: Pricing & Tax */}
          <div className="pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 pb-3 border-b border-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#087ea4]"></span>
              Pricing & GST
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Unit
                </label>
                <select
                  value={form.unit}
                  onChange={e => setField("unit", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 focus:border-[#087ea4] bg-white transition-all"
                >
                  {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  MRP (₹) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  value={form.mrp}
                  onChange={e => setField("mrp", e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  className={`w-full px-3.5 py-2 text-sm font-mono border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 transition-all ${
                    errors.mrp ? "border-rose-400 bg-rose-50/30 focus:border-rose-500" : "border-neutral-300 focus:border-[#087ea4]"
                  }`}
                />
                {errors.mrp && <p className="text-[11px] text-rose-600 mt-1">{errors.mrp}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  Selling Rate (₹) <span className="text-rose-600">*</span>
                </label>
                <input
                  type="number"
                  value={form.sellingPrice}
                  onChange={e => setField("sellingPrice", e.target.value)}
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  className={`w-full px-3.5 py-2 text-sm font-mono font-semibold text-[#174A5B] border rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 transition-all ${
                    errors.sellingPrice ? "border-rose-400 bg-rose-50/30 focus:border-rose-500" : "border-neutral-300 focus:border-[#087ea4]"
                  }`}
                />
                {errors.sellingPrice && <p className="text-[11px] text-rose-600 mt-1">{errors.sellingPrice}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1.5">
                  GST Rate
                </label>
                <select
                  value={form.gstPercent}
                  onChange={e => setField("gstPercent", e.target.value)}
                  className="w-full px-3.5 py-2 text-sm font-semibold text-neutral-800 border border-neutral-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-[#087ea4]/20 focus:border-[#087ea4] bg-white transition-all"
                >
                  {GST_RATES.map(r => <option key={r} value={r}>{r}% GST</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Section: Stock & Visibility */}
          <div className="pt-6 border-t border-neutral-100">
            <h3 className="text-sm font-semibold text-neutral-900 pb-3 border-b border-neutral-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
              Inventory & Status
            </h3>

            <div className="flex flex-wrap items-center gap-6 mt-4 pt-1">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.trackStock}
                  onChange={e => setField("trackStock", e.target.checked)}
                  className="w-4 h-4 text-[#174A5B] rounded border-neutral-300 focus:ring-[#174A5B]"
                />
                <span className="text-xs font-medium text-neutral-700">Track Inventory Stock</span>
              </label>

              {form.trackStock && (
                <div className="flex items-center gap-2">
                  <label className="text-xs font-semibold text-neutral-600">Available Stock:</label>
                  <input
                    type="number"
                    value={form.stock}
                    onChange={e => setField("stock", e.target.value)}
                    placeholder="0"
                    min={0}
                    className="w-24 px-2.5 py-1.5 text-xs font-mono font-medium border border-neutral-300 rounded-lg focus:outline-hidden focus:border-[#087ea4]"
                  />
                  <span className="text-xs text-neutral-400">{form.unit}</span>
                </div>
              )}

              <div className="w-px h-5 bg-neutral-200 hidden sm:block"></div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setField("isActive", e.target.checked)}
                  className="w-4 h-4 text-[#174A5B] rounded border-neutral-300 focus:ring-[#174A5B]"
                />
                <span className="text-xs font-medium text-neutral-700">Active (Visible in POS & Quotation Search)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-semibold text-white bg-[#174A5B] hover:bg-[#113744] active:bg-[#0c2832] rounded-lg shadow-xs transition-colors disabled:opacity-50 cursor-pointer"
          >
            {saving ? (
              <>
                <svg className="w-4 h-4 animate-spin text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
                </svg>
                Saving Product...
              </>
            ) : isEdit ? (
              "Update Product"
            ) : (
              "Create & Save Product"
            )}
          </button>
          <button
            type="button"
            onClick={() => router.push("/products")}
            className="px-5 py-2.5 text-sm font-medium text-neutral-600 bg-white border border-neutral-300 rounded-lg hover:bg-neutral-50 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
