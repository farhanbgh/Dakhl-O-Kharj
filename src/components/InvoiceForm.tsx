"use client";
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import {
  formatCurrency,
  getCurrencyLabel,
  toPersianNum,
  todayJalali,
} from "@/lib/utils";
import toast from "react-hot-toast";

interface Product {
  id: number;
  code: string;
  name: string;
  unit: string;
  salePrice: string;
  purchasePrice: string;
  stock: string;
  categoryName: string;
}

interface InvoiceItem {
  id?: number;
  productId: number | null;
  productCode: string;
  productName: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  discountPercent: number;
  discountAmount: number;
  total: number;
}

interface Customer { id: number; name: string; phone: string; balance: string; }
interface Supplier { id: number; name: string; phone: string; balance: string; }

interface InvoiceFormProps {
  type: "sale" | "purchase" | "sale_return" | "purchase_return";
  initialData?: {
    id?: number;
    customerId?: number;
    supplierId?: number;
    date?: string;
    dueDate?: string;
    discountPercent?: number;
    discountAmount?: number;
    taxPercent?: number;
    taxAmount?: number;
    notes?: string;
    items?: InvoiceItem[];
    referenceInvoiceId?: number;
  };
}

const typeConfig = {
  sale: { title: "فاکتور فروش", partyLabel: "مشتری", priceField: "salePrice" as const },
  purchase: { title: "فاکتور خرید", partyLabel: "تامین‌کننده", priceField: "purchasePrice" as const },
  sale_return: { title: "برگشت از فروش", partyLabel: "مشتری", priceField: "salePrice" as const },
  purchase_return: { title: "برگشت از خرید", partyLabel: "تامین‌کننده", priceField: "purchasePrice" as const },
};

export default function InvoiceForm({ type, initialData }: InvoiceFormProps) {
  const router = useRouter();
  const { user, currency } = useApp();
  const curr = getCurrencyLabel(currency);
  const config = typeConfig[type];
  const isEditing = !!initialData?.id;
  const isSale = type === "sale" || type === "sale_return";

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [productSearch, setProductSearch] = useState("");
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [editingItemIndex, setEditingItemIndex] = useState<number | null>(null);

  const [partyId, setPartyId] = useState<number | "">(
    isSale ? (initialData?.customerId || "") : (initialData?.supplierId || "")
  );
  const [partySearch, setPartySearch] = useState("");
  const [showPartyDropdown, setShowPartyDropdown] = useState(false);
  const [date, setDate] = useState(initialData?.date || todayJalali());
  const [dueDate, setDueDate] = useState(initialData?.dueDate || "");
  const [discountPercent, setDiscountPercent] = useState(initialData?.discountPercent || 0);
  const [discountAmount, setDiscountAmount] = useState(initialData?.discountAmount || 0);
  const [taxPercent, setTaxPercent] = useState(initialData?.taxPercent || 0);
  const [taxAmount, setTaxAmount] = useState(initialData?.taxAmount || 0);
  const [notes, setNotes] = useState(initialData?.notes || "");
  const [items, setItems] = useState<InvoiceItem[]>(initialData?.items || []);
  const [saving, setSaving] = useState(false);

  const productPickerRef = useRef<HTMLDivElement>(null);
  const partyDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/customers").then((r) => r.json()),
      fetch("/api/suppliers").then((r) => r.json()),
      fetch("/api/products?active=true").then((r) => r.json()),
    ]).then(([custData, suppData, prodData]) => {
      setCustomers(custData.customers || []);
      setSuppliers(suppData.suppliers || []);
      setAllProducts(prodData.products || []);
      setProducts(prodData.products || []);
    });
  }, []);

  useEffect(() => {
    if (productSearch.trim()) {
      const q = productSearch.toLowerCase();
      setProducts(
        allProducts.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            p.code.toLowerCase().includes(q)
        )
      );
    } else {
      setProducts(allProducts);
    }
  }, [productSearch, allProducts]);

  const parties = isSale ? customers : suppliers;
  const filteredParties = partySearch
    ? parties.filter((p) => p.name.includes(partySearch))
    : parties;

  const selectedParty = parties.find((p) => p.id === partyId);

  const subtotal = items.reduce((s, i) => s + i.total, 0);
  const finalDiscount =
    discountAmount ||
    Math.round((subtotal * (discountPercent || 0)) / 100);
  const finalTax =
    taxAmount ||
    Math.round(((subtotal - finalDiscount) * (taxPercent || 0)) / 100);
  const total = subtotal - finalDiscount + finalTax;

  const addItem = (product: Product) => {
    const price = parseFloat(product[config.priceField]) || 0;
    if (editingItemIndex !== null) {
      const updated = [...items];
      updated[editingItemIndex] = {
        ...updated[editingItemIndex],
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        unit: product.unit || "عدد",
        unitPrice: price,
        total: updated[editingItemIndex].quantity * price,
      };
      setItems(updated);
      setEditingItemIndex(null);
    } else {
      setItems((prev) => [
        ...prev,
        {
          productId: product.id,
          productCode: product.code,
          productName: product.name,
          unit: product.unit || "عدد",
          quantity: 1,
          unitPrice: price,
          discountPercent: 0,
          discountAmount: 0,
          total: price,
        },
      ]);
    }
    setShowProductPicker(false);
    setProductSearch("");
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: number | string) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: value };
    if (field === "quantity" || field === "unitPrice" || field === "discountPercent" || field === "discountAmount") {
      const qty = field === "quantity" ? Number(value) : item.quantity;
      const price = field === "unitPrice" ? Number(value) : item.unitPrice;
      const discP = field === "discountPercent" ? Number(value) : item.discountPercent;
      const discA = field === "discountAmount" ? Number(value) : item.discountAmount;
      const lineTotal = qty * price;
      const disc = discA || Math.round((lineTotal * discP) / 100);
      item.total = lineTotal - disc;
      item.discountAmount = disc;
    }
    updated[index] = item;
    setItems(updated);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!partyId) {
      toast.error(`لطفاً ${config.partyLabel} را انتخاب کنید`);
      return;
    }
    if (items.length === 0) {
      toast.error("لطفاً حداقل یک کالا اضافه کنید");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        type,
        customerId: isSale ? partyId : null,
        supplierId: !isSale ? partyId : null,
        userId: user?.id,
        date,
        dueDate: dueDate || null,
        discountPercent,
        discountAmount: finalDiscount,
        taxPercent,
        taxAmount: finalTax,
        notes,
        items: items.map((item, i) => ({ ...item, sortOrder: i })),
        referenceInvoiceId: initialData?.referenceInvoiceId || null,
      };

      const url = isEditing ? `/api/invoices/${initialData!.id}` : "/api/invoices";
      const method = isEditing ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(isEditing ? "فاکتور ویرایش شد" : "فاکتور ثبت شد");
        router.push(isSale ? "/invoices" : "/purchases");
      } else {
        toast.error(data.error || "خطا در ثبت");
      }
    } catch {
      toast.error("خطا در اتصال");
    }
    setSaving(false);
  };

  return (
    <div className="p-4 lg:p-6 space-y-4 max-w-6xl mx-auto" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-800">
          {isEditing ? `ویرایش ${config.title}` : config.title}
        </h1>
        <button
          onClick={() => router.back()}
          className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
        >
          ← برگشت
        </button>
      </div>

      {/* Party + Date */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Party Selector */}
          <div className="relative col-span-1 md:col-span-2" ref={partyDropdownRef}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {config.partyLabel} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder={`جستجو یا انتخاب ${config.partyLabel}...`}
                value={partySearch || (selectedParty?.name || "")}
                onChange={(e) => {
                  setPartySearch(e.target.value);
                  setShowPartyDropdown(true);
                  if (!e.target.value) setPartyId("");
                }}
                onFocus={() => setShowPartyDropdown(true)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              {showPartyDropdown && (
                <div className="absolute z-30 top-full right-0 left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredParties.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-3">نتیجه‌ای یافت نشد</p>
                  ) : (
                    filteredParties.slice(0, 20).map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setPartyId(p.id);
                          setPartySearch("");
                          setShowPartyDropdown(false);
                        }}
                        className="w-full text-right px-3 py-2 text-sm hover:bg-blue-50 flex items-center justify-between"
                      >
                        <span>{p.name}</span>
                        {parseFloat(p.balance) > 0 && (
                          <span className="text-xs text-red-500">
                            بدهی: {formatCurrency(p.balance, currency)}
                          </span>
                        )}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
            {selectedParty && (
              <p className="text-xs text-gray-500 mt-1">
                📞 {selectedParty.phone || "—"}
                {parseFloat(selectedParty.balance) > 0 && (
                  <span className="text-red-500 mr-2">
                    • بدهی: {formatCurrency(selectedParty.balance, currency)} {curr}
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">تاریخ</label>
            <input
              type="text"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="۱۴۰۳/۰۱/۰۱"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">سررسید</label>
            <input
              type="text"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              placeholder="اختیاری"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-700">کالاها</h3>
          <button
            onClick={() => { setEditingItemIndex(null); setShowProductPicker(true); }}
            className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
          >
            ➕ افزودن کالا
          </button>
        </div>

        {/* Product Picker Modal */}
        {showProductPicker && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col" ref={productPickerRef}>
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-800">انتخاب کالا</h3>
                <button onClick={() => { setShowProductPicker(false); setProductSearch(""); }}
                  className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
              </div>
              <div className="px-4 py-3 border-b border-gray-100">
                <input
                  autoFocus
                  type="text"
                  placeholder="🔍 جستجو بر اساس نام یا کد کالا..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="overflow-y-auto flex-1">
                {products.length === 0 ? (
                  <p className="text-center text-gray-400 py-8">کالایی یافت نشد</p>
                ) : (
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 sticky top-0">
                      <tr>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">کد</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">نام کالا</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">واحد</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">قیمت</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">موجودی</th>
                        <th className="px-4 py-2 text-right text-gray-600 font-medium">دسته</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {products.map((p) => (
                        <tr
                          key={p.id}
                          onClick={() => addItem(p)}
                          className="cursor-pointer hover:bg-blue-50 transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono text-gray-500">{p.code}</td>
                          <td className="px-4 py-2.5 font-medium text-gray-800">{p.name}</td>
                          <td className="px-4 py-2.5 text-gray-500">{p.unit}</td>
                          <td className="px-4 py-2.5 text-blue-600 font-semibold">
                            {formatCurrency(p[config.priceField], currency)}
                          </td>
                          <td className={`px-4 py-2.5 font-medium ${parseFloat(p.stock) <= 0 ? "text-red-500" : "text-green-600"}`}>
                            {toPersianNum(p.stock)}
                          </td>
                          <td className="px-4 py-2.5 text-gray-400 text-xs">{p.categoryName || "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Items */}
        {items.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            <p className="text-4xl mb-2">📦</p>
            <p className="text-sm">کالایی اضافه نشده. روی «افزودن کالا» کلیک کنید</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium w-8">#</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium">کالا</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium w-20">واحد</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium w-24">تعداد</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium w-32">قیمت واحد</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium w-24">تخفیف</th>
                  <th className="px-3 py-2 text-right text-gray-600 font-medium w-32">جمع</th>
                  <th className="px-3 py-2 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{toPersianNum(idx + 1)}</td>
                    <td className="px-3 py-2">
                      <div className="font-medium text-gray-800">{item.productName}</div>
                      <div className="text-xs text-gray-400">{item.productCode}</div>
                    </td>
                    <td className="px-3 py-2 text-gray-500">{item.unit}</td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, "quantity", parseFloat(e.target.value) || 0)}
                        className="w-20 border border-gray-300 rounded px-2 py-1 text-sm text-center"
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(idx, "unitPrice", parseFloat(e.target.value) || 0)}
                        className="w-28 border border-gray-300 rounded px-2 py-1 text-sm text-left"
                        min="0"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <input
                        type="number"
                        value={item.discountAmount}
                        onChange={(e) => updateItem(idx, "discountAmount", parseFloat(e.target.value) || 0)}
                        className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-left"
                        min="0"
                        placeholder="تخفیف"
                      />
                    </td>
                    <td className="px-3 py-2 font-semibold text-gray-800">
                      {formatCurrency(item.total, currency)}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={() => removeItem(idx)}
                        className="text-red-400 hover:text-red-600 text-lg"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Totals + Notes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <h3 className="font-semibold text-gray-700 mb-3">توضیحات</h3>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            placeholder="توضیحات فاکتور..."
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
          <h3 className="font-semibold text-gray-700 mb-2">خلاصه فاکتور</h3>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">جمع کل:</span>
            <span className="font-semibold">{formatCurrency(subtotal, currency)} {curr}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600">تخفیف:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={discountAmount}
                onChange={(e) => { setDiscountAmount(parseFloat(e.target.value) || 0); setDiscountPercent(0); }}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-left"
                placeholder="مبلغ"
                min="0"
              />
              <span className="text-xs text-gray-400">یا</span>
              <input
                type="number"
                value={discountPercent}
                onChange={(e) => { setDiscountPercent(parseFloat(e.target.value) || 0); setDiscountAmount(0); }}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-left"
                placeholder="%"
                min="0"
                max="100"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm text-gray-600">مالیات:</span>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={taxAmount}
                onChange={(e) => { setTaxAmount(parseFloat(e.target.value) || 0); setTaxPercent(0); }}
                className="w-24 border border-gray-300 rounded px-2 py-1 text-sm text-left"
                placeholder="مبلغ"
                min="0"
              />
              <span className="text-xs text-gray-400">یا</span>
              <input
                type="number"
                value={taxPercent}
                onChange={(e) => { setTaxPercent(parseFloat(e.target.value) || 0); setTaxAmount(0); }}
                className="w-16 border border-gray-300 rounded px-2 py-1 text-sm text-left"
                placeholder="%"
                min="0"
                max="100"
              />
              <span className="text-xs text-gray-400">%</span>
            </div>
          </div>
          <hr className="border-gray-200" />
          <div className="flex items-center justify-between">
            <span className="font-bold text-gray-800 text-lg">قابل پرداخت:</span>
            <span className="font-bold text-blue-600 text-xl">
              {formatCurrency(total, currency)} {curr}
            </span>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-blue-600 text-white py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition disabled:opacity-60"
            >
              {saving ? "در حال ذخیره..." : isEditing ? "ذخیره تغییرات" : "ثبت فاکتور"}
            </button>
            <button
              onClick={() => router.back()}
              className="px-4 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200 transition"
            >
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
