"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum } from "@/lib/utils";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";

interface Product {
  id: number;
  code: string;
  name: string;
  categoryId: number;
  categoryName: string;
  unit: string;
  purchasePrice: string;
  salePrice: string;
  stock: string;
  minStock: string;
  description: string;
  barcode: string;
  isActive: boolean;
}

interface Category {
  id: number;
  name: string;
}

const emptyProduct = {
  code: "", name: "", categoryId: "", unit: "عدد",
  purchasePrice: "0", salePrice: "0", stock: "0", minStock: "0",
  description: "", barcode: "", isActive: true,
};

export default function ProductsPage() {
  const { currency } = useApp();
  const curr = getCurrencyLabel(currency);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ active: "all" });
    if (search) params.set("search", search);
    if (categoryFilter) params.set("categoryId", categoryFilter);
    const res = await fetch(`/api/products?${params}`);
    const data = await res.json();
    setProducts(data.products || []);
    setLoading(false);
  }, [search, categoryFilter]);

  useEffect(() => {
    fetchProducts();
    fetch("/api/categories").then((r) => r.json()).then((d) => setCategories(d.categories || []));
  }, [fetchProducts]);

  const openNew = () => {
    setEditId(null);
    setForm(emptyProduct);
    setShowModal(true);
  };

  const openEdit = (p: Product) => {
    setEditId(p.id);
    setForm({
      code: p.code, name: p.name, categoryId: p.categoryId?.toString() || "",
      unit: p.unit || "عدد", purchasePrice: p.purchasePrice || "0",
      salePrice: p.salePrice || "0", stock: p.stock || "0",
      minStock: p.minStock || "0", description: p.description || "",
      barcode: p.barcode || "", isActive: p.isActive,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || !form.name.trim()) { toast.error("کد و نام کالا الزامی است"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/products/${editId}` : "/api/products";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, categoryId: form.categoryId ? parseInt(form.categoryId) : null }),
      });
      if (res.ok) {
        toast.success(editId ? "ویرایش شد" : "کالا افزوده شد");
        setShowModal(false);
        fetchProducts();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } catch { toast.error("خطا"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف کالا؟")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchProducts(); }
    else toast.error("خطا در حذف");
  };

  const handleExport = () => {
    const data = products.map((p) => ({
      کد: p.code,
      نام: p.name,
      دسته: p.categoryName || "",
      واحد: p.unit,
      "قیمت خرید": parseFloat(p.purchasePrice || "0"),
      "قیمت فروش": parseFloat(p.salePrice || "0"),
      موجودی: parseFloat(p.stock || "0"),
      "حداقل موجودی": parseFloat(p.minStock || "0"),
      بارکد: p.barcode || "",
      توضیحات: p.description || "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "کالاها");
    XLSX.writeFile(wb, "products.xlsx");
    toast.success("اکسپورت انجام شد");
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf);
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw = XLSX.utils.sheet_to_json<Record<string, string | number>>(ws);
      const items = raw.map((row) => ({
        code: String(row["کد"] || row["code"] || ""),
        name: String(row["نام"] || row["name"] || ""),
        unit: String(row["واحد"] || row["unit"] || "عدد"),
        purchasePrice: parseFloat(String(row["قیمت خرید"] || row["purchasePrice"] || "0")),
        salePrice: parseFloat(String(row["قیمت فروش"] || row["salePrice"] || "0")),
        stock: parseFloat(String(row["موجودی"] || row["stock"] || "0")),
      }));
      const res = await fetch("/api/products/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`${toPersianNum(data.inserted)} کالا افزوده، ${toPersianNum(data.updated)} کالا به‌روز شد`);
        fetchProducts();
      } else toast.error(data.error || "خطا در ایمپورت");
    } catch (err) {
      toast.error("خطا در خواندن فایل");
      console.error(err);
    }
    setImporting(false);
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">کالاها</h1>
          <p className="text-gray-500 text-sm mt-1">{toPersianNum(products.length)} کالا</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={openNew}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            ➕ کالای جدید
          </button>
          <button onClick={handleExport}
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            ⬇️ اکسپورت
          </button>
          <label className="bg-orange-500 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition cursor-pointer flex items-center gap-1">
            {importing ? "در حال ایمپورت..." : "⬆️ ایمپورت"}
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleImport}
              className="hidden" disabled={importing} />
          </label>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex gap-3 flex-wrap">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام، کد یا بارکد..."
            className="flex-1 min-w-48 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">همه دسته‌ها</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
          <button onClick={fetchProducts} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">جستجو</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">📦</p>
            <p>کالایی یافت نشد</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">کد</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">نام</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">دسته</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">واحد</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">قیمت خرید</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">قیمت فروش</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">موجودی</th>
                  <th className="px-4 py-3 text-center text-gray-600 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map((p) => (
                  <tr key={p.id} className={`hover:bg-gray-50 ${!p.isActive ? "opacity-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-gray-600">{p.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{p.name}</td>
                    <td className="px-4 py-3 text-gray-500">{p.categoryName || "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{p.unit}</td>
                    <td className="px-4 py-3 text-gray-600">{formatCurrency(p.purchasePrice, currency)}</td>
                    <td className="px-4 py-3 text-blue-600 font-semibold">{formatCurrency(p.salePrice, currency)}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${parseFloat(p.stock) <= parseFloat(p.minStock) && parseFloat(p.minStock) > 0 ? "text-red-600" : "text-green-600"}`}>
                        {toPersianNum(p.stock)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(p)} className="text-green-600 text-xs px-2 py-1 rounded hover:bg-green-50">ویرایش</button>
                        <button onClick={() => handleDelete(p.id)} className="text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{editId ? "ویرایش کالا" : "کالای جدید"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کد کالا <span className="text-red-500">*</span></label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام کالا <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">دسته‌بندی</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">بدون دسته</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">واحد</label>
                  <select value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {["عدد", "کیلوگرم", "گرم", "لیتر", "متر", "سانتیمتر", "بسته", "جفت", "دست"].map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">قیمت خرید ({curr})</label>
                  <input type="number" value={form.purchasePrice} onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">قیمت فروش ({curr})</label>
                  <input type="number" value={form.salePrice} onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">موجودی اولیه</label>
                  <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">حداقل موجودی</label>
                  <input type="number" value={form.minStock} onChange={(e) => setForm({ ...form, minStock: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">بارکد</label>
                  <input type="text" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div className="flex items-center gap-2 pt-4">
                  <input type="checkbox" id="isActive" checked={form.isActive}
                    onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    className="w-4 h-4 rounded" />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">فعال</label>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-60">
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setShowModal(false)} className="px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">انصراف</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
