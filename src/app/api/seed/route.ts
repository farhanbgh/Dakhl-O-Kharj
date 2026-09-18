import { NextResponse } from "next/server";
import { db } from "@/db";
import { roles, users, settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    // Check if already seeded
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) {
      return NextResponse.json({ message: "قبلاً seed شده" });
    }

    // Create default roles
    const adminRole = await db.insert(roles).values({
      name: "admin",
      displayName: "مدیر سیستم",
      permissions: {},
      isSystem: true,
    }).returning();

    const sellerRole = await db.insert(roles).values({
      name: "seller",
      displayName: "فروشنده",
      permissions: {
        "dashboard.view": true,
        "invoices.view": true,
        "invoices.create": true,
        "invoices.print": true,
        "customers.view": true,
        "products.view": true,
        "payments.view": true,
        "payments.create": true,
        "reports.view": true,
      },
      isSystem: false,
    }).returning();

    const warehouseRole = await db.insert(roles).values({
      name: "warehouse",
      displayName: "انباردار",
      permissions: {
        "dashboard.view": true,
        "products.view": true,
        "products.create": true,
        "products.edit": true,
        "reports.view": true,
      },
      isSystem: false,
    }).returning();

    // Create default admin user
    await db.insert(users).values({
      name: "مدیر سیستم",
      username: "admin",
      password: "admin",
      roleId: adminRole[0].id,
      isActive: true,
      avatar: "👨‍💼",
    });

    // Create sample users
    await db.insert(users).values([
      { name: "علی رضایی", username: "ali", password: "1234", roleId: sellerRole[0].id, isActive: true, avatar: "👨‍💼" },
      { name: "فاطمه محمدی", username: "fateme", password: "1234", roleId: sellerRole[0].id, isActive: true, avatar: "👩‍💼" },
      { name: "حسین انباردار", username: "hosein", password: "1234", roleId: warehouseRole[0].id, isActive: true, avatar: "👷" },
    ]);

    // Default settings
    await db.insert(settings).values([
      { key: "companyName", value: "فروشگاه من" },
      { key: "currency", value: "toman" },
      { key: "taxPercent", value: "9" },
      { key: "invoiceFooter", value: "با تشکر از خرید شما" },
    ]);

    return NextResponse.json({ success: true, message: "داده‌های اولیه با موفقیت ایجاد شد" });
  } catch (error) {
    console.error("Seed error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
