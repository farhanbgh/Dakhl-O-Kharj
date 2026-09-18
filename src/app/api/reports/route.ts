import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, customers, suppliers, products, payments } from "@/db/schema";
import { eq, sql, and, gte, lte } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "sales";
    const fromDate = searchParams.get("from");
    const toDate = searchParams.get("to");

    const dateConditions = [];
    if (fromDate) dateConditions.push(gte(invoices.date, fromDate));
    if (toDate) dateConditions.push(lte(invoices.date, toDate));

    if (type === "sales") {
      const conditions = [eq(invoices.type, "sale"), ...dateConditions];
      const result = await db
        .select({
          id: invoices.id,
          number: invoices.number,
          date: invoices.date,
          customerName: customers.name,
          total: invoices.total,
          paidAmount: invoices.paidAmount,
          paymentStatus: invoices.paymentStatus,
        })
        .from(invoices)
        .leftJoin(customers, eq(invoices.customerId, customers.id))
        .where(and(...conditions))
        .orderBy(invoices.date);

      const totalSales = result.reduce((s, r) => s + parseFloat(r.total ?? "0"), 0);
      return NextResponse.json({ data: result, total: totalSales });
    }

    if (type === "purchases") {
      const conditions = [eq(invoices.type, "purchase"), ...dateConditions];
      const result = await db
        .select({
          id: invoices.id,
          number: invoices.number,
          date: invoices.date,
          supplierName: suppliers.name,
          total: invoices.total,
          paidAmount: invoices.paidAmount,
          paymentStatus: invoices.paymentStatus,
        })
        .from(invoices)
        .leftJoin(suppliers, eq(invoices.supplierId, suppliers.id))
        .where(and(...conditions))
        .orderBy(invoices.date);

      const totalPurchases = result.reduce((s, r) => s + parseFloat(r.total ?? "0"), 0);
      return NextResponse.json({ data: result, total: totalPurchases });
    }

    if (type === "customer_debts") {
      const result = await db
        .select({
          id: customers.id,
          name: customers.name,
          phone: customers.phone,
          balance: customers.balance,
        })
        .from(customers)
        .where(sql`balance != 0`)
        .orderBy(sql`balance DESC`);
      return NextResponse.json({ data: result });
    }

    if (type === "supplier_debts") {
      const result = await db
        .select({
          id: suppliers.id,
          name: suppliers.name,
          phone: suppliers.phone,
          balance: suppliers.balance,
        })
        .from(suppliers)
        .where(sql`balance != 0`)
        .orderBy(sql`balance DESC`);
      return NextResponse.json({ data: result });
    }

    if (type === "stock") {
      const result = await db
        .select({
          id: products.id,
          code: products.code,
          name: products.name,
          stock: products.stock,
          minStock: products.minStock,
          unit: products.unit,
          salePrice: products.salePrice,
          purchasePrice: products.purchasePrice,
        })
        .from(products)
        .where(eq(products.isActive, true))
        .orderBy(products.name);
      return NextResponse.json({ data: result });
    }

    if (type === "payments") {
      const result = await db
        .select({
          id: payments.id,
          type: payments.type,
          amount: payments.amount,
          date: payments.date,
          method: payments.method,
          customerName: customers.name,
          supplierName: suppliers.name,
        })
        .from(payments)
        .leftJoin(customers, eq(payments.customerId, customers.id))
        .leftJoin(suppliers, eq(payments.supplierId, suppliers.id))
        .orderBy(sql`payments.created_at DESC`);
      return NextResponse.json({ data: result });
    }

    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error("Reports error:", error);
    return NextResponse.json({ error: "خطا در دریافت گزارش" }, { status: 500 });
  }
}
