"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum } from "@/lib/utils";
import toast from "react-hot-toast";

interface Customer {
  id: number;
  code: string;
  name: string;
  phone: string;
  mobile: string;
  email: string;
  address: string;
  nationalId: string;
  economicCode: string;
  creditLimit: string;
  balance: string;
  notes: string;
  isActive: boolean;
}

const emptyCustomer: Omit<Customer, "id" | "isActive"> = {
  code: "", name: "", phone: "", mobile: "", email: "",
  address: "", nationalId: "", economicCode: "", creditLimit: "0", balance: "0", notes: "",
};

export default function CustomersPage() {
  const { currency } = useApp();
  const curr = getCurrencyLabel(currency);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyCustomer);
  const [saving, setSaving] = useState(false);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    const params = search ? `?search=${encodeURIComponent(search)}` : "";
    const res = await fetch(`/api/customers${params}`);
    const data = await res.json();
    setCustomers(data.customers || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const openNew = () => {
    setEditId(null);
    setForm(emptyCustomer);
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditId(c.id);
    setForm({
      code: c.code || "", name: c.name, phone: c.phone || "", mobile: c.mobile || "",
      email: c.email || "", address: c.address || "", nationalId: c.nationalId || "",
      economicCode: c.economicCode || "", creditLimit: c.creditLimit || "0",
      balance: c.balance || "0", notes: c.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("نام مشتری الزامی است"); return; }
    setSaving(true);
    try {
      const url = editId ? `/api/customers/${editId}` : "/api/customers";
      const method = editId ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success(editId ? "ویرایش شد" : "مشتری افزوده شد");
        setShowModal(false);
        fetchCustomers();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } catch { toast.error("خطا در اتصال"); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("حذف مشتری؟")) return;
    const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchCustomers(); }
    else toast.error("خطا در حذف");
  };

  const totalDebt = customers.reduce((s, c) => s + Math.max(0, parseFloat(c.balance || "0")), 0);

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">مشتریان</h1>
          <p className="text-gray-500 text-sm mt-1">{toPersianNum(customers.length)} مشتری</p>
        </div>
        <button onClick={openNew}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
          ➕ مشتری جدید
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
          <p className="text-blue-600 text-xs">تعداد مشتریان</p>
          <p className="text-2xl font-bold text-blue-800">{toPersianNum(customers.length)}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-xl p-3">
          <p className="text-red-600 text-xs">جمع بدهی‌ها</p>
          <p className="text-xl font-bold text-red-800">{formatCurrency(totalDebt, currency)} {curr}</p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex gap-3">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو بر اساس نام یا تلفن..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
          <button onClick={fetchCustomers}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            جستجو
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : customers.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-gray-500">مشتری‌ای ثبت نشده</p>
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
                {customers.map((c) => (
                  <tr key={c.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-gray-500">{c.code || "—"}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{c.name}</td>
                    <td className="px-4 py-3 text-gray-600">{c.mobile || "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{c.phone || "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`font-semibold ${parseFloat(c.balance || "0") > 0 ? "text-red-600" : parseFloat(c.balance || "0") < 0 ? "text-green-600" : "text-gray-500"}`}>
                        {formatCurrency(c.balance, currency)} {curr}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <button onClick={() => openEdit(c)}
                          className="text-green-600 text-xs px-2 py-1 rounded hover:bg-green-50">ویرایش</button>
                        <button onClick={() => handleDelete(c.id)}
                          className="text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h3 className="font-bold text-gray-800">{editId ? "ویرایش مشتری" : "مشتری جدید"}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کد مشتری</label>
                  <input type="text" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">نام <span className="text-red-500">*</span></label>
                  <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">موبایل</label>
                  <input type="text" value={form.mobile} onChange={(e) => setForm({ ...form, mobile: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تلفن</label>
                  <input type="text" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کد ملی</label>
                  <input type="text" value={form.nationalId} onChange={(e) => setForm({ ...form, nationalId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">کد اقتصادی</label>
                  <input type="text" value={form.economicCode} onChange={(e) => setForm({ ...form, economicCode: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">ایمیل</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">سقف اعتبار ({curr})</label>
                  <input type="number" value={form.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
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
                  className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60">
                  {saving ? "در حال ذخیره..." : "ذخیره"}
                </button>
                <button onClick={() => setShowModal(false)}
                  className="px-6 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition">
                  انصراف
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
