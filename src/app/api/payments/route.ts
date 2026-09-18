import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { payments, invoices, customers, suppliers, users } from "@/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const supplierId = searchParams.get("supplierId");
    const customerId = searchParams.get("customerId");

    const conditions = [];
    if (type) conditions.push(eq(payments.type, type));
    if (supplierId) conditions.push(eq(payments.supplierId, parseInt(supplierId)));
    if (customerId) conditions.push(eq(payments.customerId, parseInt(customerId)));

    const whereClause = conditions.length > 0
      ? conditions.length === 1 ? conditions[0] : and(...conditions)
      : undefined;

    const query = db
      .select({
        id: payments.id,
        type: payments.type,
        amount: payments.amount,
        method: payments.method,
        date: payments.date,
        reference: payments.reference,
        notes: payments.notes,
        customerId: payments.customerId,
        customerName: customers.name,
        supplierId: payments.supplierId,
        supplierName: suppliers.name,
        invoiceId: payments.invoiceId,
        invoiceNumber: invoices.number,
        userId: payments.userId,
        userName: users.name,
        createdAt: payments.createdAt,
      })
      .from(payments)
      .leftJoin(customers, eq(payments.customerId, customers.id))
      .leftJoin(suppliers, eq(payments.supplierId, suppliers.id))
      .leftJoin(invoices, eq(payments.invoiceId, invoices.id))
      .leftJoin(users, eq(payments.userId, users.id))
      .orderBy(desc(payments.createdAt));

    const result = whereClause ? await query.where(whereClause) : await query;
    return NextResponse.json({ payments: result });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({ error: "خطا در دریافت پرداخت‌ها" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.insert(payments).values({
      type: data.type,
      customerId: data.customerId || null,
      supplierId: data.supplierId || null,
      invoiceId: data.invoiceId || null,
      userId: data.userId || null,
      amount: data.amount.toString(),
      method: data.method || "cash",
      date: data.date,
      reference: data.reference || null,
      notes: data.notes || null,
    }).returning();

    // Update invoice paid amount
    if (data.invoiceId) {
      await db.execute(
        sql`UPDATE invoices SET paid_amount = paid_amount + ${parseFloat(data.amount)},
          payment_status = CASE
            WHEN paid_amount + ${parseFloat(data.amount)} >= total THEN 'paid'
            WHEN paid_amount + ${parseFloat(data.amount)} > 0 THEN 'partial'
            ELSE 'unpaid'
          END
          WHERE id = ${data.invoiceId}`
      );
    }

    // Update customer/supplier balance
    if (data.customerId && data.type === "receive") {
      await db.execute(
        sql`UPDATE customers SET balance = balance - ${parseFloat(data.amount)} WHERE id = ${data.customerId}`
      );
    }
    if (data.supplierId && data.type === "pay") {
      await db.execute(
        sql`UPDATE suppliers SET balance = balance - ${parseFloat(data.amount)} WHERE id = ${data.supplierId}`
      );
    }

    return NextResponse.json({ payment: result[0] });
  } catch (error) {
    console.error("Error creating payment:", error);
    return NextResponse.json({ error: "خطا در ثبت پرداخت" }, { status: 500 });
  }
}
