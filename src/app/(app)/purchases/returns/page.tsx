"use client";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum, formatJalaliDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface Invoice { id: number; number: string; date: string; supplierName: string; userName: string; total: string; }

export default function PurchaseReturnsPage() {
  const { currency } = useApp();
  const curr = getCurrencyLabel(currency);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/invoices?type=purchase_return");
    const data = await res.json();
    setInvoices(data.invoices || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchReturns(); }, [fetchReturns]);

  const handleDelete = async (id: number) => {
    if (!confirm("حذف مرجوعی؟")) return;
    const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
    if (res.ok) { toast.success("حذف شد"); fetchReturns(); }
  };

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">برگشت از خرید</h1>
        <Link href="/purchases/returns/new"
          className="bg-orange-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-orange-600 transition">
          ➕ ثبت مرجوعی جدید
        </Link>
      </div>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : invoices.length === 0 ? (
          <div className="text-center py-16 text-gray-500">مرجوعی‌ای ثبت نشده</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">شماره</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">تاریخ</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">تامین‌کننده</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">کاربر</th>
                  <th className="px-4 py-3 text-right text-gray-600 font-medium">مبلغ</th>
                  <th className="px-4 py-3 text-center text-gray-600 font-medium">عملیات</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-orange-600">{inv.number}</td>
                    <td className="px-4 py-3 text-gray-600">{formatJalaliDate(inv.date)}</td>
                    <td className="px-4 py-3 text-gray-800">{inv.supplierName || "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{inv.userName || "—"}</td>
                    <td className="px-4 py-3 font-semibold text-orange-600">
                      {formatCurrency(inv.total, currency)} {curr}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-2">
                        <Link href={`/invoices/${inv.id}`} className="text-blue-600 text-xs px-2 py-1 rounded hover:bg-blue-50">مشاهده</Link>
                        <button onClick={() => handleDelete(inv.id)} className="text-red-500 text-xs px-2 py-1 rounded hover:bg-red-50">حذف</button>
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
