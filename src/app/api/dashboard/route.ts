import { NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, customers, suppliers, products } from "@/db/schema";
import { eq, sql, and } from "drizzle-orm";

export async function GET() {
  try {
    // Total sales (confirmed sale invoices)
    const salesResult = await db
      .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
      .from(invoices)
      .where(and(eq(invoices.type, "sale"), eq(invoices.status, "confirmed")));

    // Total purchases
    const purchasesResult = await db
      .select({ total: sql<string>`COALESCE(SUM(total), 0)` })
      .from(invoices)
      .where(and(eq(invoices.type, "purchase"), eq(invoices.status, "confirmed")));

    // Customer debts (balance > 0 means customer owes us)
    const customerDebtResult = await db
      .select({ total: sql<string>`COALESCE(SUM(balance), 0)` })
      .from(customers)
      .where(sql`balance > 0`);

    // Supplier debts (balance > 0 means we owe them)
    const supplierDebtResult = await db
      .select({ total: sql<string>`COALESCE(SUM(balance), 0)` })
      .from(suppliers)
      .where(sql`balance > 0`);

    // Product count
    const productCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(eq(products.isActive, true));

    // Customer count
    const customerCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(customers)
      .where(eq(customers.isActive, true));

    // Low stock products
    const lowStockResult = await db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        stock: products.stock,
        minStock: products.minStock,
      })
      .from(products)
      .where(sql`stock <= min_stock AND is_active = true`)
      .limit(10);

    // Top customers by debt
    const topDebtors = await db
      .select({
        id: customers.id,
        name: customers.name,
        balance: customers.balance,
      })
      .from(customers)
      .where(sql`balance > 0`)
      .orderBy(sql`balance DESC`)
      .limit(5);

    // Top supplier debts
    const topSupplierDebts = await db
      .select({
        id: suppliers.id,
        name: suppliers.name,
        balance: suppliers.balance,
      })
      .from(suppliers)
      .where(sql`balance > 0`)
      .orderBy(sql`balance DESC`)
      .limit(5);

    // Recent invoices
    const recentInvoices = await db
      .select({
        id: invoices.id,
        number: invoices.number,
        type: invoices.type,
        date: invoices.date,
        total: invoices.total,
        paymentStatus: invoices.paymentStatus,
      })
      .from(invoices)
      .orderBy(sql`created_at DESC`)
      .limit(5);

    return NextResponse.json({
      totalSales: parseFloat(salesResult[0].total),
      totalPurchases: parseFloat(purchasesResult[0].total),
      customerDebt: parseFloat(customerDebtResult[0].total),
      supplierDebt: parseFloat(supplierDebtResult[0].total),
      productCount: Number(productCount[0].count),
      customerCount: Number(customerCount[0].count),
      lowStockProducts: lowStockResult,
      topDebtors,
      topSupplierDebts,
      recentInvoices,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    return NextResponse.json({ error: "خطا در دریافت اطلاعات داشبورد" }, { status: 500 });
  }
}
