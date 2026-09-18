import { NextResponse } from "next/server";
import { db } from "@/db";
import { products, customers, suppliers, invoices, invoiceItems, payments, settings, users, roles, productCategories } from "@/db/schema";

export async function GET() {
  try {
    const [
      allProducts,
      allCustomers,
      allSuppliers,
      allInvoices,
      allInvoiceItems,
      allPayments,
      allSettings,
      allUsers,
      allRoles,
      allCategories,
    ] = await Promise.all([
      db.select().from(products),
      db.select().from(customers),
      db.select().from(suppliers),
      db.select().from(invoices),
      db.select().from(invoiceItems),
      db.select().from(payments),
      db.select().from(settings),
      db.select().from(users),
      db.select().from(roles),
      db.select().from(productCategories),
    ]);

    const backup = {
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      data: {
        products: allProducts,
        customers: allCustomers,
        suppliers: allSuppliers,
        invoices: allInvoices,
        invoiceItems: allInvoiceItems,
        payments: allPayments,
        settings: allSettings,
        users: allUsers,
        roles: allRoles,
        productCategories: allCategories,
      },
    };

    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
      },
    });
  } catch (error) {
    console.error("Backup error:", error);
    return NextResponse.json({ error: "خطا در ایجاد بکاپ" }, { status: 500 });
  }
}
