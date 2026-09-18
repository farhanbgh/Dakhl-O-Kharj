import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import {
  products, customers, suppliers, invoices, invoiceItems,
  payments, settings, users, roles, productCategories
} from "@/db/schema";
import { sql } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();

    if (!data.version || !data.data) {
      return NextResponse.json({ error: "فرمت بکاپ معتبر نیست" }, { status: 400 });
    }

    const d = data.data;

    // Clear all tables
    await db.execute(sql`TRUNCATE TABLE invoice_items, payments, invoices, products, product_categories, customers, suppliers, users, roles, settings RESTART IDENTITY CASCADE`);

    // Restore roles
    if (d.roles?.length > 0) {
      await db.insert(roles).values(d.roles.map((r: typeof roles.$inferInsert) => ({
        id: r.id, name: r.name, displayName: r.displayName,
        permissions: r.permissions || {}, isSystem: r.isSystem || false,
      })));
    }

    // Restore users
    if (d.users?.length > 0) {
      await db.insert(users).values(d.users.map((u: typeof users.$inferInsert) => ({
        id: u.id, name: u.name, username: u.username, password: u.password || "1234",
        roleId: u.roleId, isActive: u.isActive !== false, avatar: u.avatar || "👤",
      })));
    }

    // Restore categories
    if (d.productCategories?.length > 0) {
      await db.insert(productCategories).values(d.productCategories.map((c: typeof productCategories.$inferInsert) => ({
        id: c.id, name: c.name, code: c.code, parentId: c.parentId, description: c.description,
      })));
    }

    // Restore products
    if (d.products?.length > 0) {
      await db.insert(products).values(d.products.map((p: typeof products.$inferInsert) => ({
        id: p.id, code: p.code, name: p.name, categoryId: p.categoryId,
        unit: p.unit || "عدد", purchasePrice: p.purchasePrice?.toString() || "0",
        salePrice: p.salePrice?.toString() || "0", stock: p.stock?.toString() || "0",
        minStock: p.minStock?.toString() || "0", description: p.description,
        barcode: p.barcode, isActive: p.isActive !== false,
      })));
    }

    // Restore customers
    if (d.customers?.length > 0) {
      await db.insert(customers).values(d.customers.map((c: typeof customers.$inferInsert) => ({
        id: c.id, code: c.code, name: c.name, phone: c.phone, mobile: c.mobile,
        email: c.email, address: c.address, nationalId: c.nationalId, economicCode: c.economicCode,
        creditLimit: c.creditLimit?.toString() || "0", balance: c.balance?.toString() || "0",
        isActive: c.isActive !== false, notes: c.notes,
      })));
    }

    // Restore suppliers
    if (d.suppliers?.length > 0) {
      await db.insert(suppliers).values(d.suppliers.map((s: typeof suppliers.$inferInsert) => ({
        id: s.id, code: s.code, name: s.name, phone: s.phone, mobile: s.mobile,
        email: s.email, address: s.address, nationalId: s.nationalId, economicCode: s.economicCode,
        balance: s.balance?.toString() || "0", isActive: s.isActive !== false, notes: s.notes,
      })));
    }

    // Restore invoices
    if (d.invoices?.length > 0) {
      await db.insert(invoices).values(d.invoices.map((inv: typeof invoices.$inferInsert) => ({
        id: inv.id, number: inv.number, type: inv.type, status: inv.status || "confirmed",
        customerId: inv.customerId, supplierId: inv.supplierId, userId: inv.userId,
        date: inv.date, dueDate: inv.dueDate,
        subtotal: inv.subtotal?.toString() || "0", discountPercent: inv.discountPercent?.toString() || "0",
        discountAmount: inv.discountAmount?.toString() || "0", taxPercent: inv.taxPercent?.toString() || "0",
        taxAmount: inv.taxAmount?.toString() || "0", total: inv.total?.toString() || "0",
        paidAmount: inv.paidAmount?.toString() || "0", paymentStatus: inv.paymentStatus || "unpaid",
        referenceInvoiceId: inv.referenceInvoiceId, notes: inv.notes,
      })));
    }

    // Restore invoice items
    if (d.invoiceItems?.length > 0) {
      await db.insert(invoiceItems).values(d.invoiceItems.map((item: typeof invoiceItems.$inferInsert) => ({
        id: item.id, invoiceId: item.invoiceId, productId: item.productId,
        productCode: item.productCode, productName: item.productName, unit: item.unit,
        quantity: item.quantity?.toString() || "0", unitPrice: item.unitPrice?.toString() || "0",
        discountPercent: item.discountPercent?.toString() || "0",
        discountAmount: item.discountAmount?.toString() || "0",
        total: item.total?.toString() || "0", sortOrder: item.sortOrder || 0,
      })));
    }

    // Restore payments
    if (d.payments?.length > 0) {
      await db.insert(payments).values(d.payments.map((p: typeof payments.$inferInsert) => ({
        id: p.id, type: p.type, customerId: p.customerId, supplierId: p.supplierId,
        invoiceId: p.invoiceId, userId: p.userId, amount: p.amount?.toString() || "0",
        method: p.method || "cash", date: p.date, reference: p.reference, notes: p.notes,
      })));
    }

    // Restore settings
    if (d.settings?.length > 0) {
      await db.insert(settings).values(d.settings.map((s: typeof settings.$inferInsert) => ({
        id: s.id, key: s.key, value: s.value,
      })));
    }

    // Reset sequences
    await db.execute(sql`SELECT setval('roles_id_seq', COALESCE((SELECT MAX(id) FROM roles), 1))`);
    await db.execute(sql`SELECT setval('users_id_seq', COALESCE((SELECT MAX(id) FROM users), 1))`);
    await db.execute(sql`SELECT setval('products_id_seq', COALESCE((SELECT MAX(id) FROM products), 1))`);
    await db.execute(sql`SELECT setval('customers_id_seq', COALESCE((SELECT MAX(id) FROM customers), 1))`);
    await db.execute(sql`SELECT setval('suppliers_id_seq', COALESCE((SELECT MAX(id) FROM suppliers), 1))`);
    await db.execute(sql`SELECT setval('invoices_id_seq', COALESCE((SELECT MAX(id) FROM invoices), 1))`);
    await db.execute(sql`SELECT setval('invoice_items_id_seq', COALESCE((SELECT MAX(id) FROM invoice_items), 1))`);
    await db.execute(sql`SELECT setval('payments_id_seq', COALESCE((SELECT MAX(id) FROM payments), 1))`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Restore error:", error);
    return NextResponse.json({ error: "خطا در بازیابی بکاپ: " + String(error) }, { status: 500 });
  }
}
