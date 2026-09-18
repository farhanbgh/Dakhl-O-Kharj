"use client";
import { useState, useEffect, useCallback } from "react";
import { useApp } from "@/contexts/AppContext";
import { formatCurrency, getCurrencyLabel, toPersianNum, formatJalaliDate } from "@/lib/utils";
import toast from "react-hot-toast";

interface ReportRow {
  id: number;
  number?: string;
  date?: string;
  customerName?: string;
  supplierName?: string;
  name?: string;
  phone?: string;
  balance?: string;
  total?: string;
  paidAmount?: string;
  paymentStatus?: string;
  code?: string;
  stock?: string;
  minStock?: string;
  unit?: string;
  salePrice?: string;
  purchasePrice?: string;
  amount?: string;
  type?: string;
  method?: string;
}

const reportTypes = [
  { key: "sales", label: "فاکتورهای فروش", icon: "📈" },
  { key: "purchases", label: "فاکتورهای خرید", icon: "🛒" },
  { key: "customer_debts", label: "بدهی مشتریان", icon: "👥" },
  { key: "supplier_debts", label: "بدهی به تامین‌کنندگان", icon: "🏭" },
  { key: "stock", label: "گزارش موجودی", icon: "📦" },
  { key: "payments", label: "گزارش پرداخت‌ها", icon: "💰" },
];

const paymentStatusLabel: Record<string, string> = {
  paid: "پرداخت شده", partial: "نیمه‌پرداخت", unpaid: "پرداخت نشده",
};
const paymentStatusColor: Record<string, string> = {
  paid: "bg-green-100 text-green-700", partial: "bg-yellow-100 text-yellow-700", unpaid: "bg-red-100 text-red-700",
};

export default function ReportsPage() {
  const { currency } = useApp();
  const curr = getCurrencyLabel(currency);
  const [reportType, setReportType] = useState("sales");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<ReportRow[]>([]);
  const [totalAmount, setTotalAmount] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType });
      if (fromDate) params.set("from", fromDate);
      if (toDate) params.set("to", toDate);
      const res = await fetch(`/api/reports?${params}`);
      const d = await res.json();
      setData(d.data || []);
      setTotalAmount(d.total !== undefined ? d.total : null);
    } catch { toast.error("خطا در دریافت گزارش"); }
    setLoading(false);
  }, [reportType, fromDate, toDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const handlePrint = () => window.print();

  const renderTable = () => {
    if (data.length === 0) {
      return <div className="text-center py-16 text-gray-500"><p className="text-4xl mb-3">📊</p><p>داده‌ای یافت نشد</p></div>;
    }

    if (reportType === "sales" || reportType === "purchases") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">شماره</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">تاریخ</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">{reportType === "sales" ? "مشتری" : "تامین‌کننده"}</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">مبلغ</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">وضعیت</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-blue-600">{row.number}</td>
                  <td className="px-4 py-3 text-gray-600">{formatJalaliDate(row.date || "")}</td>
                  <td className="px-4 py-3 text-gray-800">{row.customerName || row.supplierName || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(row.total, currency)} {curr}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${paymentStatusColor[row.paymentStatus || ""] || "bg-gray-100 text-gray-600"}`}>
                      {paymentStatusLabel[row.paymentStatus || ""] || row.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {totalAmount !== null && (
              <tfoot className="bg-blue-50 border-t-2 border-blue-200">
                <tr>
                  <td colSpan={3} className="px-4 py-3 font-bold text-gray-700">جمع کل</td>
                  <td className="px-4 py-3 font-bold text-blue-700">{formatCurrency(totalAmount, currency)} {curr}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      );
    }

    if (reportType === "customer_debts" || reportType === "supplier_debts") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">نام</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">تلفن</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">مانده</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.phone || "—"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${parseFloat(row.balance || "0") > 0 ? "text-red-600" : "text-green-600"}`}>
                      {formatCurrency(row.balance, currency)} {curr}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    if (reportType === "stock") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">کد</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">نام کالا</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">واحد</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">موجودی</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">حداقل</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">قیمت فروش</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">ارزش انبار</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => {
                const stockVal = parseFloat(row.stock || "0");
                const price = parseFloat(row.purchasePrice || "0");
                const value = stockVal * price;
                return (
                  <tr key={row.id} className={`hover:bg-gray-50 ${stockVal <= parseFloat(row.minStock || "0") && parseFloat(row.minStock || "0") > 0 ? "bg-red-50" : ""}`}>
                    <td className="px-4 py-3 font-mono text-gray-500">{row.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-3 text-gray-500">{row.unit}</td>
                    <td className={`px-4 py-3 font-semibold ${stockVal <= parseFloat(row.minStock || "0") && parseFloat(row.minStock || "0") > 0 ? "text-red-600" : "text-green-600"}`}>
                      {toPersianNum(row.stock || "0")}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{toPersianNum(row.minStock || "0")}</td>
                    <td className="px-4 py-3 text-blue-600">{formatCurrency(row.salePrice, currency)}</td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(value, currency)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      );
    }

    if (reportType === "payments") {
      return (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">نوع</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">تاریخ</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">طرف حساب</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">مبلغ</th>
                <th className="px-4 py-3 text-right text-gray-600 font-medium">روش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {data.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${row.type === "receive" ? "bg-green-100 text-green-700" : "bg-blue-100 text-blue-700"}`}>
                      {row.type === "receive" ? "دریافت" : "پرداخت"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{formatJalaliDate(row.date || "")}</td>
                  <td className="px-4 py-3 text-gray-800">{row.customerName || row.supplierName || "—"}</td>
                  <td className="px-4 py-3 font-semibold">{formatCurrency(row.amount, currency)} {curr}</td>
                  <td className="px-4 py-3 text-gray-500">{row.method || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="p-4 lg:p-6" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">گزارشات</h1>
        <button onClick={handlePrint}
          className="no-print bg-gray-700 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 transition flex items-center gap-1">
          🖨️ چاپ گزارش
        </button>
      </div>

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mb-4 no-print">
        {reportTypes.map((rt) => (
          <button key={rt.key} onClick={() => setReportType(rt.key)}
            className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all text-sm
              ${reportType === rt.key ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-blue-300 text-gray-600"}`}>
            <span className="text-2xl mb-1">{rt.icon}</span>
            <span className="text-xs text-center leading-tight">{rt.label}</span>
          </button>
        ))}
      </div>

      {/* Date Filters */}
      {(reportType === "sales" || reportType === "purchases") && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-4 no-print">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">از تاریخ</label>
              <input type="text" value={fromDate} onChange={(e) => setFromDate(e.target.value)}
                placeholder="۱۴۰۳/۰۱/۰۱"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">تا تاریخ</label>
              <input type="text" value={toDate} onChange={(e) => setToDate(e.target.value)}
                placeholder="۱۴۰۳/۱۲/۲۹"
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-36" />
            </div>
            <div className="flex items-end">
              <button onClick={fetchReport}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
                اعمال فیلتر
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Report Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between no-print">
          <h3 className="font-bold text-gray-800">
            {reportTypes.find((r) => r.key === reportType)?.icon}{" "}
            {reportTypes.find((r) => r.key === reportType)?.label}
          </h3>
          <span className="text-sm text-gray-500">{toPersianNum(data.length)} ردیف</span>
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : renderTable()}
      </div>
    </div>
  );
}
