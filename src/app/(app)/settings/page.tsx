"use client";
import { useState, useEffect } from "react";
import { useApp } from "@/contexts/AppContext";
import toast from "react-hot-toast";
import { APP_VERSION } from "@/lib/utils";

export default function SettingsPage() {
  const { loadSettings, settings } = useApp();
  const [form, setForm] = useState({
    companyName: "",
    companyPhone: "",
    companyAddress: "",
    currency: "toman",
    taxPercent: "0",
    invoiceFooter: "با تشکر از خرید شما",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      companyName: settings.companyName || "",
      companyPhone: settings.companyPhone || "",
      companyAddress: settings.companyAddress || "",
      currency: settings.currency || "toman",
      taxPercent: settings.taxPercent || "0",
      invoiceFooter: settings.invoiceFooter || "با تشکر از خرید شما",
    }));
  }, [settings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast.success("تنظیمات ذخیره شد");
        await loadSettings();
      } else toast.error("خطا در ذخیره");
    } catch { toast.error("خطا"); }
    setSaving(false);
  };

  return (
    <div className="p-4 lg:p-6 max-w-2xl" dir="rtl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-800">تنظیمات سیستم</h1>
        <p className="text-gray-500 text-sm mt-1">نسخه {APP_VERSION}</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
        {/* Company Info */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">🏢 اطلاعات شرکت</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">نام شرکت / فروشگاه</label>
              <input type="text" value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">شماره تلفن</label>
              <input type="text" value={form.companyPhone}
                onChange={(e) => setForm({ ...form, companyPhone: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">آدرس</label>
              <textarea value={form.companyAddress}
                onChange={(e) => setForm({ ...form, companyAddress: e.target.value })}
                rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">💰 تنظیمات مالی</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">واحد پول</label>
              <select value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500">
                <option value="toman">تومان</option>
                <option value="rial">ریال</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">مالیات پیش‌فرض (%)</label>
              <input type="number" value={form.taxPercent}
                onChange={(e) => setForm({ ...form, taxPercent: e.target.value })}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                min="0" max="100" />
            </div>
          </div>
        </div>

        {/* Invoice Settings */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">🧾 تنظیمات فاکتور</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">متن پایین فاکتور</label>
            <textarea value={form.invoiceFooter}
              onChange={(e) => setForm({ ...form, invoiceFooter: e.target.value })}
              rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500"
              placeholder="با تشکر از خرید شما" />
          </div>
        </div>

        {/* System Info */}
        <div>
          <h3 className="font-semibold text-gray-700 mb-4 pb-2 border-b border-gray-100">ℹ️ اطلاعات سیستم</h3>
          <div className="bg-gray-50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">نسخه نرم‌افزار:</span>
              <span className="font-mono font-semibold text-blue-600">{APP_VERSION}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">پشتیبانی API وب‌سایت:</span>
              <span className="text-green-600 font-medium">✅ آماده (RESTful API)</span>
            </div>
            <div className="text-xs text-gray-400 mt-2 border-t pt-2">
              برای اتصال به وب‌سایت فروش، از endpoint های API این سیستم استفاده کنید.
              مستندات API در آینده اضافه خواهد شد.
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button onClick={handleSave} disabled={saving}
            className="bg-blue-600 text-white px-8 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60">
            {saving ? "در حال ذخیره..." : "💾 ذخیره تنظیمات"}
          </button>
        </div>
      </div>
    </div>
  );
}
