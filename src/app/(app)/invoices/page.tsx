"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum, formatJalaliDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Invoice {
  id: number;
  number: string;
  type: string;
  date: string;
  customerName: string;
  userName: string;
  total: string;
  paidAmount: string;
  paymentStatus: string;
  status: string;
}

const paymentStatusLabel: Record<string, string> = {
  paid: "پرداخت شده",
  partial: "نیمه‌پرداخت",
  unpaid: "پرداخت نشده",
};
const paymentStatusColor: Record<string, string> = {
  paid: "bg-green-100 text-green-700",
  partial: "bg-yellow-100 text-yellow-700",
  unpaid: "bg-red-100 text-red-700",
};

export default function InvoicesPage() {
  const { currency } = useApp();
  const curr = getCurrencyLabel(currency);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [total, setTotal] = useState(0);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: "sale" });
      if (search) params.set("search", search);
      const res = await fetch(`/api/invoices?${params}`);
      const data = await res.json();
      setInvoices(data.invoices || []);
      setTotal(data.total || 0);
    } catch {
      toast.error("خطا در دریافت فاکتورها");
    }
    setLoading(false);
  }, [search]);

  useEffect(() => { fetchInvoices(); }, [fetchInvoices]);

  const handleDelete = async (id: number) => {
    if (!confirm("آیا از حذف این فاکتور مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) { toast.success("فاکتور حذف شد"); fetchInvoices(); }
      else toast.error("خطا در حذف");
    } catch { toast.error("خطا در اتصال"); }
  };

  const totalAmount = invoices.reduce((s, i) => s + parseFloat(i.total || "0"), 0);

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">فاکتورهای فروش</h1>
          <p className="text-gray-500 text-sm mt-1">{toPersianNum(total)} فاکتور</p>
        </div>
        <div className="flex gap-2">
          <Link href="/invoices/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition flex items-center gap-1">
            ➕ فاکتور جدید
          </Link>
          <Link href="/invoices/returns"
            className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition flex items-center gap-1">
            ↩️ برگشت فروش
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4">
        <div className="flex gap-3">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="جستجو با شماره فاکتور..."
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={fetchInvoices}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">
            جستجو
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 mb-4 flex items-center justify-between">
        <span className="text-blue-700 text-sm font-medium">جمع کل فروش نمایش یافته:</span>
        <span className="text-blue-800 font-bold text-lg">{formatCurrency(totalAmount, currency)} {curr}</span>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500 font-medium">فاکتوری ثبت نشده</p>
            <Link href="/invoices/new"
              className="inline-block mt-3 text-blue-600 hover:underline text-sm">
              اولین فاکتور را ثبت کنید
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">شماره</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">مشتری</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">کاربر</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">مبلغ کل</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">وضعیت پرداخت</th>
                  <th className="px-4 py-3 text-center text-gray-600 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono font-semibold text-blue-600">{inv.number}</td>
                    <td className="px-4 py-3 text-gray-600">{formatJalaliDate(inv.date)}</td>
                    <td className="px-4 py-3 text-gray-800">{inv.customerName || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{inv.userName || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">
                      {formatCurrency(inv.total, currency)} {curr}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColor[inv.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                        {paymentStatusLabel[inv.paymentStatus] || inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-2">
                        <Link href={`/invoices/${inv.id}`}
                          className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-1 rounded hover:bg-blue-50">
                          مشاهده
                        </Link>
                        <Link href={`/invoices/${inv.id}/edit`}
                          className="text-green-600 hover:text-green-800 text-xs font-medium px-2 py-1 rounded hover:bg-green-50">
                          ویرایش
                        </Link>
                        <button
                          onClick={() => handleDelete(inv.id)}
                          className="text-red-500 hover:text-red-700 text-xs font-medium px-2 py-1 rounded hover:bg-red-50">
                          حذف
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
