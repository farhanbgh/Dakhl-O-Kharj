"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum, formatJalaliDate, todayJalali } from "@/lib/utils";
import toast from "react-hot-toast";

interface Payment {
  id: number;
  type: string;
  amount: string;
  method: string;
  date: string;
  reference: string;
  customerName: string;
  supplierName: string;
  invoiceNumber: string;
  userName: string;
  notes: string;
}

interface Supplier { id: number; name: string; balance: string; }
interface Customer { id: number; name: string; balance: string; }

const methodLabels: Record<string, string> = {
  cash: "نقدی", card: "کارت", transfer: "انتقال بانکی", check: "چک",
};

export default function PaymentsPage() {
  const { currency, user } = useApp();
  const curr = getCurrencyLabel(currency);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [payType, setPayType] = useState<"receive" | "pay">("pay");
  const [form, setForm] = useState({
    supplierId: "", customerId: "", amount: "", method: "cash",
    date: todayJalali(), reference: "", notes: "", invoiceId: "",
  });
  const [saving, setSaving] = useState(false);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    const params = typeFilter ? `?type=${typeFilter}` : "";
    const res = await fetch(`/api/payments${params}`);
    const data = await res.json();
    setPayments(data.payments || []);
    setLoading(false);
  }, [typeFilter]);

  useEffect(() => {
    fetchPayments();
    Promise.all([
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([suppData, custData]) => {
      setSuppliers(suppData.suppliers || []);
      setCustomers(custData.customers || []);
    });
  }, [fetchPayments]);

  const openPaySupplier = () => {
    setPayType("pay");
    setForm({ supplierId: "", customerId: "", amount: "", method: "cash",
      date: todayJalali(), reference: "", notes: "", invoiceId: "" });
    setShowModal(true);
  };

  const openReceiveCustomer = () => {
    setPayType("receive");
    setForm({ supplierId: "", customerId: "", amount: "", method: "cash",
      date: todayJalali(), reference: "", notes: "", invoiceId: "" });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.amount || parseFloat(form.amount) <= 0) { toast.error("مبلغ الزامی است"); return; }
    if (payType === "pay" && !form.supplierId) { toast.error("تامین‌کننده را انتخاب کنید"); return; }
    if (payType === "receive" && !form.customerId) { toast.error("مشتری را انتخاب کنید"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: payType,
          supplierId: payType === "pay" ? parseInt(form.supplierId) : null,
          customerId: payType === "receive" ? parseInt(form.customerId) : null,
          amount: parseFloat(form.amount),
          method: form.method,
          date: form.date,
          reference: form.reference || null,
          notes: form.notes || null,
          userId: user?.id,
          invoiceId: form.invoiceId ? parseInt(form.invoiceId) : null,
        }),
      });
      if (res.ok) {
        toast.success("پرداخت ثبت شد");
        setShowModal(false);
        fetchPayments();
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا");
      }
    } catch { toast.error("خطا"); }
    setSaving(false);
  };

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">پرداخت‌ها</h1>
          <p className="text-gray-500 text-sm mt-1">{toPersianNum(payments.length)} تراکنش</p>
        </div>
        <div className="flex gap-2">
          <button onClick={openReceiveCustomer}
            className="bg-green-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition">
            💰 دریافت از مشتری
          </button>
          <button onClick={openPaySupplier}
            className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            💳 پرداخت به تامین‌کننده
          </button>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex gap-3">
          <select value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
            <option value="">همه</option>
            <option value="receive">دریافت از مشتری</option>
            <option value="pay">پرداخت به تامین‌کننده</option>
          </select>
          <button onClick={fetchPayments} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">فیلتر</button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : payments.length === 0 ? (
          <div className="text-center py-16 text-gray-500">
            <p className="text-4xl mb-3">💰</p>
            <p>تراکنشی ثبت نشده</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">نوع</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">طرف حساب</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">مبلغ</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">روش</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">فاکتور</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">کاربر</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${p.type === "receive" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                        {p.type === "receive" ? "دریافت" : "پرداخت"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{formatJalaliDate(p.date)}</td>
                    <td className="px-4 py-3 text-gray-800">{p.customerName || p.supplierName || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatCurrency(p.amount, currency)} {curr}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{methodLabels[p.method] || p.method}</td>
                    <td className="px-4 py-3 text-blue-600 font-mono text-xs">{p.invoiceNumber || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{p.userName || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between">
              <h3 className="font-bold text-gray-800">
                {payType === "pay" ? "💳 پرداخت به تامین‌کننده" : "💰 دریافت از مشتری"}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-xl">✕</button>
            </div>
            <div className="p-6 space-y-4">
              {payType === "pay" ? (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تامین‌کننده <span className="text-red-500">*</span></label>
                  <select value={form.supplierId} onChange={(e) => setForm({ ...form, supplierId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">انتخاب کنید...</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {parseFloat(s.balance || "0") > 0 ? `(بدهی: ${formatCurrency(s.balance, currency)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مشتری <span className="text-red-500">*</span></label>
                  <select value={form.customerId} onChange={(e) => setForm({ ...form, customerId: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option value="">انتخاب کنید...</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {parseFloat(c.balance || "0") > 0 ? `(بدهی: ${formatCurrency(c.balance, currency)})` : ""}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">مبلغ ({curr}) <span className="text-red-500">*</span></label>
                  <input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" min="0" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label>
                  <input type="text" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">روش پرداخت</label>
                  <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    {Object.entries(methodLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">شماره پیگیری</label>
                  <input type="text" value={form.reference} onChange={(e) => setForm({ ...form, reference: e.target.value })}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">توضیحات</label>
                <textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
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
