"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import InvoiceForm from "@/components/InvoiceForm";

export default function EditInvoicePage() {
  const { id } = useParams();
  const [initialData, setInitialData] = useState<Parameters<typeof InvoiceForm>[0]["initialData"]>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/invoices/${id}`)
      .then((r) => r.json())
      .then((data) => {
        const inv = data.invoice;
        const items = (data.items || []).map((item: {
          id: number;
          productId: number;
          productCode: string;
          productName: string;
          unit: string;
          quantity: string;
          unitPrice: string;
          discountPercent: string;
          discountAmount: string;
          total: string;
        }) => ({
          id: item.id,
          productId: item.productId,
          productCode: item.productCode,
          productName: item.productName,
          unit: item.unit,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          discountPercent: parseFloat(item.discountPercent || "0"),
          discountAmount: parseFloat(item.discountAmount || "0"),
          total: parseFloat(item.total),
        }));
        setInitialData({
          id: inv.id,
          customerId: inv.customerId,
          supplierId: inv.supplierId,
          date: inv.date,
          dueDate: inv.dueDate,
          discountPercent: parseFloat(inv.discountPercent || "0"),
          discountAmount: parseFloat(inv.discountAmount || "0"),
          taxPercent: parseFloat(inv.taxPercent || "0"),
          taxAmount: parseFloat(inv.taxAmount || "0"),
          notes: inv.notes,
          items,
        });
      })
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!initialData) return <div className="text-center py-16 text-gray-500">فاکتور یافت نشد</div>;

  return <InvoiceForm type="sale" initialData={initialData} />;
}
