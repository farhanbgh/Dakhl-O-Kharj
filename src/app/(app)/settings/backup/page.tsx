"use client";
import { useState, useRef } from "react";
import toast from "react-hot-toast";
import { APP_VERSION, toPersianNum, toJalaliDisplay } from "@/lib/utils";

export default function BackupPage() {
  const [downloading, setDownloading] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [backupInfo, setBackupInfo] = useState<{
    version: string;
    timestamp: string;
    counts: Record<string, number>;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleDownloadBackup = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) { toast.error("خطا در ایجاد بکاپ"); return; }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("بکاپ با موفقیت دانلود شد");
    } catch { toast.error("خطا در دانلود بکاپ"); }
    setDownloading(false);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (!data.version || !data.data) {
        toast.error("فایل بکاپ معتبر نیست");
        return;
      }
      setBackupInfo({
        version: data.version,
        timestamp: data.timestamp,
        counts: {
          products: data.data.products?.length || 0,
          customers: data.data.customers?.length || 0,
          suppliers: data.data.suppliers?.length || 0,
          invoices: data.data.invoices?.length || 0,
          payments: data.data.payments?.length || 0,
          users: data.data.users?.length || 0,
          roles: data.data.roles?.length || 0,
        },
      });
    } catch { toast.error("خطا در خواندن فایل بکاپ"); }
  };

  const handleRestore = async () => {
    const file = fileRef.current?.files?.[0];
    if (!file) { toast.error("فایل بکاپ را انتخاب کنید"); return; }
    if (!confirm("⚠️ این عملیات تمام داده‌های فعلی را جایگزین می‌کند. آیا مطمئن هستید؟")) return;
    setRestoring(true);
    try {
      const text = await file.text();
      const backupData = JSON.parse(text);
      const res = await fetch("/api/backup/restore", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(backupData),
      });
      if (res.ok) {
        toast.success("بکاپ با موفقیت بازیابی شد");
        setBackupInfo(null);
        if (fileRef.current) fileRef.current.value = "";
      } else {
        const d = await res.json();
        toast.error(d.error || "خطا در بازیابی");
      }
    } catch { toast.error("خطا در بازیابی بکاپ"); }
    setRestoring(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">بکاپ و بازیابی</h1>
        <p className="text-gray-500 text-sm mt-1">مدیریت پشتیبان‌گیری از داده‌ها</p>
      </div>

      {/* Backup Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span>💾</span> ایجاد بکاپ
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          از تمام اطلاعات سیستم شامل کالاها، مشتریان، فاکتورها و ... بکاپ بگیرید.
          فایل بکاپ با فرمت JSON ذخیره می‌شود.
        </p>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-blue-700">
            ℹ️ برای استفاده در سیستم دیگر، فایل بکاپ را در آن سیستم بازیابی کنید.
          </p>
        </div>
        <button onClick={handleDownloadBackup} disabled={downloading}
          className="bg-blue-600 text-white px-6 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60 flex items-center gap-2">
          {downloading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              در حال ایجاد بکاپ...
            </>
          ) : (
            <>⬇️ دانلود بکاپ</>
          )}
        </button>
      </div>

      {/* Restore Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
          <span>🔄</span> بازیابی بکاپ
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          یک فایل بکاپ JSON را انتخاب کنید تا اطلاعات بازیابی شود.
        </p>
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-700">
            ⚠️ هشدار: بازیابی بکاپ تمام داده‌های فعلی را جایگزین می‌کند. این عمل غیرقابل بازگشت است.
          </p>
        </div>

        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition">
            <p className="text-4xl mb-2">📂</p>
            <p className="text-sm text-gray-600">فایل بکاپ JSON را اینجا رها کنید یا کلیک کنید</p>
          </div>
          <input ref={fileRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        </label>

        {backupInfo && (
          <div className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4">
            <h4 className="font-semibold text-green-800 mb-2">✅ فایل بکاپ معتبر</h4>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">نسخه بکاپ:</span>
                <span className="font-mono">{backupInfo.version}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">تاریخ بکاپ:</span>
                <span>{new Date(backupInfo.timestamp).toLocaleString("fa-IR")}</span>
              </div>
              <hr className="border-green-200 my-2" />
              {Object.entries(backupInfo.counts).map(([key, count]) => {
                const labels: Record<string, string> = {
                  products: "کالاها", customers: "مشتریان", suppliers: "تامین‌کنندگان",
                  invoices: "فاکتورها", payments: "پرداخت‌ها", users: "کاربران", roles: "نقش‌ها",
                };
                return (
                  <div key={key} className="flex justify-between">
                    <span className="text-gray-600">{labels[key] || key}:</span>
                    <span className="font-semibold">{toPersianNum(count)} رکورد</span>
                  </div>
                );
              })}
            </div>
            <button onClick={handleRestore} disabled={restoring}
              className="mt-4 w-full bg-green-600 text-white py-2.5 rounded-lg font-semibold hover:bg-green-700 transition disabled:opacity-60">
              {restoring ? "در حال بازیابی..." : "🔄 بازیابی بکاپ"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
