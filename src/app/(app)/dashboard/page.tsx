"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum, formatJalaliDate } from "@/lib/utils";

interface DashboardData {
  totalSales: number;
  totalPurchases: number;
  customerDebt: number;
  supplierDebt: number;
  productCount: number;
  customerCount: number;
  lowStockProducts: Array<{ id: number; code: string; name: string; stock: string; minStock: string }>;
  topDebtors: Array<{ id: number; name: string; balance: string }>;
  topSupplierDebts: Array<{ id: number; name: string; balance: string }>;
  recentInvoices: Array<{ id: number; number: string; type: string; date: string; total: string; paymentStatus: string }>;
}

export default function DashboardPage() {
  const { currency, user } = useApp();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const curr = getCurrencyLabel(currency);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const stats = [
    {
      label: "کل فروش",
      value: formatCurrency(data?.totalSales, currency),
      unit: curr,
      icon: "📈",
      color: "bg-green-50 border-green-200",
      textColor: "text-green-700",
      iconBg: "bg-green-100",
    },
    {
      label: "کل خرید",
      value: formatCurrency(data?.totalPurchases, currency),
      unit: curr,
      icon: "🛒",
      color: "bg-blue-50 border-blue-200",
      textColor: "text-blue-700",
      iconBg: "bg-blue-100",
    },
    {
      label: "بدهی مشتریان",
      value: formatCurrency(data?.customerDebt, currency),
      unit: curr,
      icon: "👥",
      color: "bg-orange-50 border-orange-200",
      textColor: "text-orange-700",
      iconBg: "bg-orange-100",
    },
    {
      label: "بدهی به تامین‌کنندگان",
      value: formatCurrency(data?.supplierDebt, currency),
      unit: curr,
      icon: "🏭",
      color: "bg-red-50 border-red-200",
      textColor: "text-red-700",
      iconBg: "bg-red-100",
    },
    {
      label: "تعداد کالاها",
      value: toPersianNum(data?.productCount || 0),
      unit: "قلم",
      icon: "📦",
      color: "bg-purple-50 border-purple-200",
      textColor: "text-purple-700",
      iconBg: "bg-purple-100",
    },
    {
      label: "تعداد مشتریان",
      value: toPersianNum(data?.customerCount || 0),
      unit: "نفر",
      icon: "🤝",
      color: "bg-indigo-50 border-indigo-200",
      textColor: "text-indigo-700",
      iconBg: "bg-indigo-100",
    },
  ];

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
  const invoiceTypeLabel: Record<string, string> = {
    sale: "فروش",
    purchase: "خرید",
    sale_return: "برگشت فروش",
    purchase_return: "برگشت خرید",
  };

  return (
    <div className="p-4 lg:p-6 space-y-6" dir="rtl">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            سلام، {user?.name} 👋
          </h1>
          <p className="text-gray-500 text-sm mt-1">خلاصه وضعیت سیستم</p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/invoices/new"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition"
          >
            ➕ فاکتور فروش
          </Link>
          <Link
            href="/purchases/new"
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            ➕ فاکتور خرید
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((stat, i) => (
          <div key={i} className={`rounded-xl border p-4 ${stat.color}`}>
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3 ${stat.iconBg}`}>
              {stat.icon}
            </div>
            <p className="text-gray-500 text-xs mb-1">{stat.label}</p>
            <p className={`text-xl font-bold ${stat.textColor}`}>{stat.value}</p>
            <p className="text-gray-400 text-xs">{stat.unit}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">آخرین فاکتورها</h3>
            <Link href="/invoices" className="text-blue-600 text-xs hover:underline">مشاهده همه</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.recentInvoices || []).length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">فاکتوری ثبت نشده</p>
            ) : (
              data?.recentInvoices.map((inv) => (
                <Link key={inv.id} href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition">
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{inv.number}</p>
                    <p className="text-xs text-gray-400">{invoiceTypeLabel[inv.type]} • {formatJalaliDate(inv.date)}</p>
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold text-gray-700">{formatCurrency(inv.total, currency)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${paymentStatusColor[inv.paymentStatus] || "bg-gray-100 text-gray-600"}`}>
                      {paymentStatusLabel[inv.paymentStatus] || inv.paymentStatus}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Top Debtors */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">🔴 بدهکاران برتر</h3>
            <Link href="/reports?type=customer_debts" className="text-blue-600 text-xs hover:underline">همه</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.topDebtors || []).length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">بدهی‌ای وجود ندارد</p>
            ) : (
              data?.topDebtors.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-700">{d.name}</span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(d.balance, currency)} {curr}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Supplier Debts */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-800">🏭 بدهی به تامین‌کنندگان</h3>
            <Link href="/reports?type=supplier_debts" className="text-blue-600 text-xs hover:underline">همه</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {(data?.topSupplierDebts || []).length === 0 ? (
              <p className="text-center text-gray-400 py-6 text-sm">بدهی‌ای وجود ندارد</p>
            ) : (
              data?.topSupplierDebts.map((d) => (
                <div key={d.id} className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm text-gray-700">{d.name}</span>
                  <span className="text-sm font-bold text-red-600">
                    {formatCurrency(d.balance, currency)} {curr}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Low Stock */}
      {(data?.lowStockProducts || []).length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            ⚠️ هشدار کمبود موجودی
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
            {data?.lowStockProducts.map((p) => (
              <div key={p.id} className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-xs text-gray-500">{p.code}</p>
                <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                <p className="text-xs text-amber-700 mt-1">
                  موجودی: {toPersianNum(p.stock)} (حداقل: {toPersianNum(p.minStock)})
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
