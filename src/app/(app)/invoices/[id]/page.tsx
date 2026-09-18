"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useApp } from "@/contexts/AppContext";
import {
  formatCurrency,
  getCurrencyLabel,
  toPersianNum,
  formatJalaliDate,
} from "@/lib/utils";
import toast from "react-hot-toast";

interface InvoiceDetail {
  id: number;
  number: string;
  type: string;
  status: string;
  date: string;
  dueDate: string;
  subtotal: string;
  discountAmount: string;
  taxAmount: string;
  total: string;
  paidAmount: string;
  paymentStatus: string;
  notes: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  supplierName: string;
  supplierPhone: string;
  userName: string;
  referenceInvoiceId: number;
}

interface InvoiceItem {
  id: number;
  productCode: string;
  productName: string;
  unit: string;
  quantity: string;
  unitPrice: string;
  discountAmount: string;
  total: string;
}

const typeLabel: Record<string, string> = {
  sale: "فاکتور فروش",
  purchase: "فاکتور خرید",
  sale_return: "برگشت از فروش",
  purchase_return: "برگشت از خرید",
};

export default function InvoiceDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { currency, settings } = useApp();
  const curr = getCurrencyLabel(currency);
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [items, setItems] = useState<InvoiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<"a4" | "80mm">("a4");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => {
        setInvoice(data.invoice);
        setItems(data.items || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = (mode: "a4" | "80mm") => {
    setPrintMode(mode);
    setTimeout(() => window.print(), 100);
  };

  const handleDelete = async () => {
    if (!confirm("آیا از حذف این فاکتور مطمئن هستید؟")) return;
    try {
      const res = await fetch(`/api/invoices/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("فاکتور حذف شد");
        router.back();
      } else toast.error("خطا در حذف");
    } catch { toast.error("خطا"); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!invoice) {
    return <div className="text-center py-16 text-gray-500">فاکتور یافت نشد</div>;
  }

  const isSale = invoice.type === "sale" || invoice.type === "sale_return";
  const partyName = isSale ? invoice.customerName : invoice.supplierName;
  const partyPhone = isSale ? invoice.customerPhone : invoice.supplierPhone;
  const partyAddress = isSale ? invoice.customerAddress : "";

  return (
    <div className="p-4 lg:p-6 max-w-4xl mx-auto" dir="rtl">
      {/* Actions */}
      <div className="flex items-center justify-between mb-6 no-print">
        <div className="flex items-center gap-2">
          <button onClick={() => router.back()} className="text-gray-500 hover:text-gray-700">← برگشت</button>
          <h1 className="text-xl font-bold text-gray-800">{typeLabel[invoice.type]}</h1>
          <span className="text-gray-400">#{invoice.number}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => handlePrint("a4")}
            className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-800 transition flex items-center gap-1">
            🖨️ چاپ A4
          </button>
          <button onClick={() => handlePrint("80mm")}
            className="bg-gray-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-700 transition flex items-center gap-1">
            🖨️ چاپ ۸ سانتی
          </button>
          <Link href={`/invoices/${id}/edit`}
            className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-green-700 transition">
            ✏️ ویرایش
          </Link>
          <button onClick={handleDelete}
            className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-red-600 transition">
            🗑️ حذف
          </button>
        </div>
      </div>

      {/* Printable Invoice */}
      <div ref={printRef} className={`bg-white rounded-xl shadow-sm border border-gray-200 print-page ${printMode === "80mm" ? "max-w-xs mx-auto" : ""}`}>
        {/* Header */}
        <div className={`${printMode === "80mm" ? "p-3" : "p-6"} border-b border-gray-200`}>
          <div className={`flex ${printMode === "80mm" ? "flex-col gap-2" : "items-start justify-between"}`}>
            <div>
              <h2 className={`font-bold text-gray-900 ${printMode === "80mm" ? "text-base text-center" : "text-2xl"}`}>
                {settings.companyName || "شرکت من"}
              </h2>
              {settings.companyPhone && (
                <p className="text-gray-500 text-sm">{settings.companyPhone}</p>
              )}
              {settings.companyAddress && (
                <p className="text-gray-400 text-xs">{settings.companyAddress}</p>
              )}
            </div>
            <div className={`${printMode === "80mm" ? "text-center" : "text-left"}`}>
              <h3 className={`font-bold text-gray-800 ${printMode === "80mm" ? "text-sm" : "text-xl"}`}>
                {typeLabel[invoice.type]}
              </h3>
              <p className={`text-gray-600 ${printMode === "80mm" ? "text-xs" : "text-sm"}`}>
                شماره: {invoice.number}
              </p>
              <p className={`text-gray-600 ${printMode === "80mm" ? "text-xs" : "text-sm"}`}>
                تاریخ: {formatJalaliDate(invoice.date)}
              </p>
              {invoice.dueDate && (
                <p className="text-gray-500 text-xs">سررسید: {formatJalaliDate(invoice.dueDate)}</p>
              )}
            </div>
          </div>
        </div>

        {/* Party Info */}
        <div className={`${printMode === "80mm" ? "px-3 py-2" : "px-6 py-4"} bg-gray-50 border-b border-gray-200`}>
          <div className={`grid ${printMode === "80mm" ? "grid-cols-1" : "grid-cols-2"} gap-2`}>
            <div>
              <p className="text-xs text-gray-500">{isSale ? "مشتری" : "تامین‌کننده"}</p>
              <p className={`font-semibold text-gray-800 ${printMode === "80mm" ? "text-sm" : ""}`}>
                {partyName || "—"}
              </p>
              {partyPhone && <p className="text-xs text-gray-500">{partyPhone}</p>}
              {partyAddress && <p className="text-xs text-gray-400">{partyAddress}</p>}
            </div>
            <div>
              <p className="text-xs text-gray-500">کاربر ثبت کننده</p>
              <p className="font-medium text-gray-700 text-sm">{invoice.userName || "—"}</p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className={`${printMode === "80mm" ? "px-2" : "px-6"} py-4`}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b-2 border-gray-300">
                {printMode !== "80mm" && <th className="py-2 text-right text-gray-600 font-medium">#</th>}
                <th className="py-2 text-right text-gray-600 font-medium">کالا</th>
                <th className="py-2 text-right text-gray-600 font-medium">تعداد</th>
                <th className="py-2 text-right text-gray-600 font-medium">قیمت</th>
                {printMode !== "80mm" && <th className="py-2 text-right text-gray-600 font-medium">تخفیف</th>}
                <th className="py-2 text-left text-gray-600 font-medium">جمع</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.map((item, idx) => (
                <tr key={item.id}>
                  {printMode !== "80mm" && (
                    <td className="py-2 text-gray-400">{toPersianNum(idx + 1)}</td>
                  )}
                  <td className="py-2">
                    <div className="font-medium text-gray-800">{item.productName}</div>
                    {printMode !== "80mm" && <div className="text-xs text-gray-400">{item.productCode}</div>}
                  </td>
                  <td className="py-2 text-gray-600">
                    {toPersianNum(item.quantity)} {item.unit}
                  </td>
                  <td className="py-2 text-gray-600">
                    {formatCurrency(item.unitPrice, currency)}
                  </td>
                  {printMode !== "80mm" && (
                    <td className="py-2 text-red-500">
                      {parseFloat(item.discountAmount) > 0 ? formatCurrency(item.discountAmount, currency) : "—"}
                    </td>
                  )}
                  <td className="py-2 font-semibold text-gray-800 text-left">
                    {formatCurrency(item.total, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totals */}
        <div className={`${printMode === "80mm" ? "px-3 py-2" : "px-6 py-4"} border-t border-gray-200 bg-gray-50`}>
          <div className="space-y-1 max-w-xs mr-auto">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">جمع کل:</span>
              <span className="font-medium">{formatCurrency(invoice.subtotal, currency)} {curr}</span>
            </div>
            {parseFloat(invoice.discountAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">تخفیف:</span>
                <span className="text-red-500">({formatCurrency(invoice.discountAmount, currency)} {curr})</span>
              </div>
            )}
            {parseFloat(invoice.taxAmount) > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">مالیات:</span>
                <span className="text-orange-500">{formatCurrency(invoice.taxAmount, currency)} {curr}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-1 border-t border-gray-300">
              <span>مبلغ قابل پرداخت:</span>
              <span className="text-blue-600">{formatCurrency(invoice.total, currency)} {curr}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">پرداخت شده:</span>
              <span className="text-green-600">{formatCurrency(invoice.paidAmount, currency)} {curr}</span>
            </div>
            {parseFloat(invoice.total) - parseFloat(invoice.paidAmount) > 0 && (
              <div className="flex justify-between text-sm font-bold text-red-600">
                <span>مانده:</span>
                <span>{formatCurrency(parseFloat(invoice.total) - parseFloat(invoice.paidAmount), currency)} {curr}</span>
              </div>
            )}
          </div>
        </div>

        {/* Notes & Footer */}
        {(invoice.notes || settings.invoiceFooter) && (
          <div className={`${printMode === "80mm" ? "px-3 py-2" : "px-6 py-4"} border-t border-gray-100`}>
            {invoice.notes && (
              <p className="text-sm text-gray-600 mb-2">توضیحات: {invoice.notes}</p>
            )}
            {settings.invoiceFooter && (
              <p className="text-xs text-gray-400 text-center">{settings.invoiceFooter}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
