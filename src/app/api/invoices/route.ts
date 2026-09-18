import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, customers, suppliers, users, products } from "@/db/schema";
import { eq, desc, and, or, ilike, sql } from "drizzle-orm";
import { todayJalali } from "@/lib/utils";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = (page - 1) * limit;

    const conditions = [];
    if (type) {
      if (type === "sale") conditions.push(eq(invoices.type, "sale"));
      else if (type === "purchase") conditions.push(eq(invoices.type, "purchase"));
      else if (type === "sale_return") conditions.push(eq(invoices.type, "sale_return"));
      else if (type === "purchase_return") conditions.push(eq(invoices.type, "purchase_return"));
    }
    if (search) {
      conditions.push(ilike(invoices.number, `%${search}%`));
    }

    const whereClause = conditions.length > 0
      ? conditions.length === 1 ? conditions[0] : and(...conditions)
      : undefined;

    const query = db
      .select({
        id: invoices.id,
        number: invoices.number,
        type: invoices.type,
        status: invoices.status,
        date: invoices.date,
        dueDate: invoices.dueDate,
        total: invoices.total,
        paidAmount: invoices.paidAmount,
        paymentStatus: invoices.paymentStatus,
        notes: invoices.notes,
        customerId: invoices.customerId,
        customerName: customers.name,
        supplierId: invoices.supplierId,
        supplierName: suppliers.name,
        userId: invoices.userId,
        userName: users.name,
        referenceInvoiceId: invoices.referenceInvoiceId,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(suppliers, eq(invoices.supplierId, suppliers.id))
      .leftJoin(users, eq(invoices.userId, users.id))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const result = whereClause ? await query.where(whereClause) : await query;

    const countQuery = db.select({ count: sql<number>`count(*)` }).from(invoices);
    const countResult = whereClause ? await countQuery.where(whereClause) : await countQuery;
    const total = Number(countResult[0].count);

    return NextResponse.json({ invoices: result, total, page, limit });
  } catch (error) {
    console.error("Error fetching invoices:", error);
    return NextResponse.json({ error: "خطا در دریافت فاکتورها" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    // Generate invoice number
    const prefix = data.type === "sale" ? "F" : data.type === "purchase" ? "X" : data.type === "sale_return" ? "R" : "RX";
    const lastInvoice = await db
      .select({ number: invoices.number })
      .from(invoices)
      .where(ilike(invoices.number, `${prefix}%`))
      .orderBy(desc(invoices.createdAt))
      .limit(1);

    let nextNum = 1;
    if (lastInvoice.length > 0) {
      const lastNum = parseInt(lastInvoice[0].number.replace(prefix, "")) || 0;
      nextNum = lastNum + 1;
    }
    const number = `${prefix}${String(nextNum).padStart(5, "0")}`;

    // Calculate totals
    const items = data.items || [];
    const subtotal = items.reduce((sum: number, item: { total: string | number }) => sum + (parseFloat(String(item.total)) || 0), 0);
    const discountAmount = parseFloat(data.discountAmount) || 0;
    const taxAmount = parseFloat(data.taxAmount) || 0;
    const total = subtotal - discountAmount + taxAmount;

    const invoice = await db.insert(invoices).values({
      number,
      type: data.type,
      status: "confirmed",
      customerId: data.customerId || null,
      supplierId: data.supplierId || null,
      userId: data.userId || null,
      date: data.date || todayJalali(),
      dueDate: data.dueDate || null,
      subtotal: subtotal.toString(),
      discountPercent: data.discountPercent?.toString() || "0",
      discountAmount: discountAmount.toString(),
      taxPercent: data.taxPercent?.toString() || "0",
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      paidAmount: "0",
      paymentStatus: "unpaid",
      referenceInvoiceId: data.referenceInvoiceId ? Number(data.referenceInvoiceId) : null,
      notes: data.notes || null,
    }).returning();

    const invoiceId = invoice[0].id;

    // Insert items and update stock
    for (const item of items) {
      await db.insert(invoiceItems).values({
        invoiceId,
        productId: item.productId || null,
        productCode: item.productCode,
        productName: item.productName,
        unit: item.unit,
        quantity: item.quantity.toString(),
        unitPrice: item.unitPrice.toString(),
        discountPercent: item.discountPercent?.toString() || "0",
        discountAmount: item.discountAmount?.toString() || "0",
        total: item.total.toString(),
        sortOrder: item.sortOrder || 0,
      });

      // Update stock
      if (item.productId) {
        const stockChange = (data.type === "sale" || data.type === "purchase_return")
          ? -parseFloat(item.quantity)
          : parseFloat(item.quantity);

        await db.execute(
          sql`UPDATE products SET stock = stock + ${stockChange} WHERE id = ${item.productId}`
        );
      }
    }

    // Update customer/supplier balance
    if (data.customerId && (data.type === "sale" || data.type === "sale_return")) {
      const balanceChange = data.type === "sale" ? total : -total;
      await db.execute(
        sql`UPDATE customers SET balance = balance + ${balanceChange} WHERE id = ${data.customerId}`
      );
    }
    if (data.supplierId && (data.type === "purchase" || data.type === "purchase_return")) {
      const balanceChange = data.type === "purchase" ? total : -total;
      await db.execute(
        sql`UPDATE suppliers SET balance = balance + ${balanceChange} WHERE id = ${data.supplierId}`
      );
    }

    return NextResponse.json({ invoice: invoice[0] });
  } catch (error) {
    console.error("Error creating invoice:", error);
    return NextResponse.json({ error: "خطا در ثبت فاکتور" }, { status: 500 });
  }
}
