"use client";
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import { toPersianNum } from "@/lib/utils";

interface Category { id: number; name: string; code: string; description: string; }

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", code: "", description: "" });
  const [saving, setSaving] = useState(false);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/categories");
    const data = await res.json();
    setCategories(data.categories || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openNew = () => {
    setEditId(null);
    setForm({ name: "", code: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (c: Category) => {
    setEditId(c.id);
    setForm({ name: c.name, code: c.code || "", description: c.description || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("نام الزامی است"); return; }
    setSaving(true);
    try {
      const method = editId ? "PUT" : "POST";
      const body = editId ? { id: editId, ...form } : form;
      const res = await fetch("/api/categories", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        toast.success(editId ? "ویرایش شد" : "دسته‌بندی افزوده شد");
        setShowModal(false);
        fetchCategories();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } catch { toast.error("خطا"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف دسته‌بندی؟")) return;
    const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchCategories(); }
    else toast.error("خطا در حذف");
  };

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">دسته‌بندی کالاها</h1>
          <p className="text-gray-500 text-sm mt-1">{toPersianNum(categories.length)} دسته</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          ➕ دسته جدید
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🏷️</p>
            <p>دسته‌ای ثبت نشده</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">نام</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">کد</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">توضیحات</th>
                <th className="px-4 py-3 text-center text-gray-600 font-medium">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {categories.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                  <td className="px-4 py-3 font-mono text-gray-500">{c.code || "—"}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{c.description || "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center gap-2">
                      <button onClick={() => openEdit(c)} className="text-green-600 text-xs px-2 py-1 rounded hover:bg-green-50">ویرایش</button>
                      <button onClick={() => handleDelete(c.id)} className="text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
              <h3 className="font-bold text-gray-800">{editId ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">نام دسته <span className="text-red-500">*</span></label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" autoFocus />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">کد</label>
                <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
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
