import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(req: NextRequest) {
  try {
    const { items } = await req.json();
    let inserted = 0;
    let updated = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        if (!item.code || !item.name) {
          errors.push(`ردیف بدون کد یا نام کالا`);
          continue;
        }
        const existing = await db.select().from(products).where(eq(products.code, item.code)).limit(1);
        if (existing.length > 0) {
          await db.update(products).set({
            name: item.name,
            unit: item.unit || "عدد",
            purchasePrice: item.purchasePrice?.toString() || "0",
            salePrice: item.salePrice?.toString() || "0",
            stock: item.stock?.toString() || "0",
            updatedAt: new Date(),
          }).where(eq(products.code, item.code));
          updated++;
        } else {
          await db.insert(products).values({
            code: item.code,
            name: item.name,
            unit: item.unit || "عدد",
            purchasePrice: item.purchasePrice?.toString() || "0",
            salePrice: item.salePrice?.toString() || "0",
            stock: item.stock?.toString() || "0",
            isActive: true,
          });
          inserted++;
        }
      } catch (e) {
        errors.push(`خطا در کالا ${item.code}: ${e}`);
      }
    }

    return NextResponse.json({ inserted, updated, errors });
  } catch (error) {
    console.error("Error importing products:", error);
    return NextResponse.json({ error: "خطا در ایمپورت" }, { status: 500 });
  }
}
