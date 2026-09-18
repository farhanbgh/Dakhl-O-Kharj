import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { invoices, invoiceItems, customers, suppliers, users } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await db
      .select({
        id: invoices.id,
        number: invoices.number,
        type: invoices.type,
        status: invoices.status,
        date: invoices.date,
        dueDate: invoices.dueDate,
        subtotal: invoices.subtotal,
        discountPercent: invoices.discountPercent,
        discountAmount: invoices.discountAmount,
        taxPercent: invoices.taxPercent,
        taxAmount: invoices.taxAmount,
        total: invoices.total,
        paidAmount: invoices.paidAmount,
        paymentStatus: invoices.paymentStatus,
        notes: invoices.notes,
        customerId: invoices.customerId,
        customerName: customers.name,
        customerPhone: customers.phone,
        customerAddress: customers.address,
        supplierId: invoices.supplierId,
        supplierName: suppliers.name,
        supplierPhone: suppliers.phone,
        userId: invoices.userId,
        userName: users.name,
        referenceInvoiceId: invoices.referenceInvoiceId,
        createdAt: invoices.createdAt,
      })
      .from(invoices)
      .leftJoin(customers, eq(invoices.customerId, customers.id))
      .leftJoin(suppliers, eq(invoices.supplierId, suppliers.id))
      .leftJoin(users, eq(invoices.userId, users.id))
      .where(eq(invoices.id, parseInt(id)))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "فاکتور یافت نشد" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, parseInt(id)))
      .orderBy(invoiceItems.sortOrder);

    return NextResponse.json({ invoice: result[0], items });
  } catch (error) {
    console.error("Error fetching invoice:", error);
    return NextResponse.json({ error: "خطا در دریافت فاکتور" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);
    const data = await req.json();

    // Get old invoice data to reverse stock/balance changes
    const oldInvoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!oldInvoice.length) return NextResponse.json({ error: "فاکتور یافت نشد" }, { status: 404 });

    const old = oldInvoice[0];
    const oldItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    // Reverse old stock changes
    for (const item of oldItems) {
      if (item.productId) {
        const stockReverse = (old.type === "sale" || old.type === "purchase_return")
          ? parseFloat(item.quantity)
          : -parseFloat(item.quantity);
        await db.execute(sql`UPDATE products SET stock = stock + ${stockReverse} WHERE id = ${item.productId}`);
      }
    }

    // Reverse old balance changes
    if (old.customerId && (old.type === "sale" || old.type === "sale_return")) {
      const oldTotal = parseFloat(old.total ?? "0");
      const balanceReverse = old.type === "sale" ? -oldTotal : oldTotal;
      await db.execute(sql`UPDATE customers SET balance = balance + ${balanceReverse} WHERE id = ${old.customerId}`);
    }
    if (old.supplierId && (old.type === "purchase" || old.type === "purchase_return")) {
      const oldTotal = parseFloat(old.total ?? "0");
      const balanceReverse = old.type === "purchase" ? -oldTotal : oldTotal;
      await db.execute(sql`UPDATE suppliers SET balance = balance + ${balanceReverse} WHERE id = ${old.supplierId}`);
    }

    // Delete old items
    await db.delete(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    // Calculate new totals
    const items = data.items || [];
    const subtotal = items.reduce((sum: number, item: { total: string | number }) => sum + (parseFloat(String(item.total)) || 0), 0);
    const discountAmount = parseFloat(data.discountAmount) || 0;
    const taxAmount = parseFloat(data.taxAmount) || 0;
    const total = subtotal - discountAmount + taxAmount;

    // Update invoice
    await db.update(invoices).set({
      customerId: data.customerId || null,
      supplierId: data.supplierId || null,
      date: data.date,
      dueDate: data.dueDate || null,
      subtotal: subtotal.toString(),
      discountPercent: data.discountPercent?.toString() || "0",
      discountAmount: discountAmount.toString(),
      taxPercent: data.taxPercent?.toString() || "0",
      taxAmount: taxAmount.toString(),
      total: total.toString(),
      notes: data.notes || null,
      updatedAt: new Date(),
    }).where(eq(invoices.id, invoiceId));

    // Insert new items
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

      // Apply new stock changes
      if (item.productId) {
        const stockChange = (old.type === "sale" || old.type === "purchase_return")
          ? -parseFloat(item.quantity)
          : parseFloat(item.quantity);
        await db.execute(sql`UPDATE products SET stock = stock + ${stockChange} WHERE id = ${item.productId}`);
      }
    }

    // Apply new balance changes
    if (data.customerId && (old.type === "sale" || old.type === "sale_return")) {
      const balanceChange = old.type === "sale" ? total : -total;
      await db.execute(sql`UPDATE customers SET balance = balance + ${balanceChange} WHERE id = ${data.customerId}`);
    }
    if (data.supplierId && (old.type === "purchase" || old.type === "purchase_return")) {
      const balanceChange = old.type === "purchase" ? total : -total;
      await db.execute(sql`UPDATE suppliers SET balance = balance + ${balanceChange} WHERE id = ${data.supplierId}`);
    }

    const updated = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    return NextResponse.json({ invoice: updated[0] });
  } catch (error) {
    console.error("Error updating invoice:", error);
    return NextResponse.json({ error: "خطا در ویرایش فاکتور" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const invoiceId = parseInt(id);

    const oldInvoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).limit(1);
    if (!oldInvoice.length) return NextResponse.json({ error: "فاکتور یافت نشد" }, { status: 404 });

    const old = oldInvoice[0];
    const oldItems = await db.select().from(invoiceItems).where(eq(invoiceItems.invoiceId, invoiceId));

    // Reverse stock
    for (const item of oldItems) {
      if (item.productId) {
        const stockReverse = (old.type === "sale" || old.type === "purchase_return")
          ? parseFloat(item.quantity)
          : -parseFloat(item.quantity);
        await db.execute(sql`UPDATE products SET stock = stock + ${stockReverse} WHERE id = ${item.productId}`);
      }
    }

    // Reverse balance
    if (old.customerId && (old.type === "sale" || old.type === "sale_return")) {
      const oldTotal = parseFloat(old.total ?? "0");
      const balanceReverse = old.type === "sale" ? -oldTotal : oldTotal;
      await db.execute(sql`UPDATE customers SET balance = balance + ${balanceReverse} WHERE id = ${old.customerId}`);
    }
    if (old.supplierId && (old.type === "purchase" || old.type === "purchase_return")) {
      const oldTotal = parseFloat(old.total ?? "0");
      const balanceReverse = old.type === "purchase" ? -oldTotal : oldTotal;
      await db.execute(sql`UPDATE suppliers SET balance = balance + ${balanceReverse} WHERE id = ${old.supplierId}`);
    }

    await db.delete(invoices).where(eq(invoices.id, invoiceId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    return NextResponse.json({ error: "خطا در حذف فاکتور" }, { status: 500 });
  }
}
