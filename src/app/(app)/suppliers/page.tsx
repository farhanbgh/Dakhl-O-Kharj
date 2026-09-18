"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum } from "@/lib/utils";
import toast from "react-hot-toast";

interface Supplier {
  id: number;
  code: string;
  name: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  balance: string;
  notes: string;
}

const emptySupplier = {
  code: "", name: "", phone: "", mobile: "", email: "",
  address: "", nationalId: "", economicCode: "", notes: "",
};

export default function SuppliersPage() {
  const { currency } = useApp();
  const curr = getCurrencyLabel(currency);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptySupplier);
  const [saving, setSaving] = useState(false);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/suppliers${params}`);
    const data = await res.json();
    setSuppliers(data.suppliers || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchSuppliers(); }, [fetchSuppliers]);

  const openNew = () => {
    setEditId(null);
    setForm(emptySupplier);
    setShowModal(true);
  };

  const openEdit = (s: Supplier) => {
    setEditId(s.id);
    setForm({ code: s.code || "", name: s.name, phone: s.phone || "", mobile: s.mobile || "",
      email: s.email || "", address: s.address || "", nationalId: "", economicCode: "", notes: s.notes || "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("نام الزامی است"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/suppliers/${editId}` : "/api/suppliers";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editId ? "ویرایش شد" : "تامین‌کننده افزوده شد");
        setShowModal(false);
        fetchSuppliers();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } catch { toast.error("خطا"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف تامین‌کننده؟")) return;
    const res = await fetch(`/api/suppliers/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchSuppliers(); }
    else toast.error("خطا در حذف");
  };

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">تامین‌کنندگان</h1>
          <p className="text-gray-500 text-sm mt-1">{toPersianNum(suppliers.length)} تامین‌کننده</p>
        </div>
        <button onClick={openNew}
          className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
          ➕ تامین‌کننده جدید
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm" />
          <button onClick={fetchSuppliers} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">جستجو</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">🏭</p>
            <p>تامین‌کننده‌ای ثبت نشده</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">کد</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">نام</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">موبایل</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">تلفن</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">مانده حساب</th>
                  <th className="px-4 py-3 text-center text-gray-600 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{s.code || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.mobile || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${parseFloat(s.balance || "0") > 0 ? "text-red-600" : "text-gray-500"}`}>
                        {formatCurrency(s.balance, currency)} {curr}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(s)} className="text-green-600 text-xs px-2 py-1 rounded hover:bg-green-50">ویرایش</button>
                        <button onClick={() => handleDelete(s.id)} className="text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
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
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
              <h3 className="font-bold text-gray-800">{editId ? "ویرایش تامین‌کننده" : "تامین‌کننده جدید"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: "کد", field: "code" }, { label: "نام *", field: "name" },
                  { label: "موبایل", field: "mobile" }, { label: "تلفن", field: "phone" },
                  { label: "ایمیل", field: "email" }, { label: "کد ملی", field: "nationalId" },
                ].map(({ label, field }) => (
                  <div key={field}>
                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                    <input type="text" value={(form as Record<string, string>)[field] || ""}
                      onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  </div>
                ))}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
                <textarea value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">یادداشت</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 disabled:opacity-60">
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
