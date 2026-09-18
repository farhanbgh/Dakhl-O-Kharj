import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let result;
    if (search) {
      result = await db.select().from(suppliers)
        .where(or(ilike(suppliers.name, `%${search}%`), ilike(suppliers.phone, `%${search}%`)))
        .orderBy(desc(suppliers.createdAt));
    } else {
      result = await db.select().from(suppliers).orderBy(desc(suppliers.createdAt));
    }

    return NextResponse.json({ suppliers: result });
  } catch (error) {
    console.error("Error fetching suppliers:", error);
    return NextResponse.json({ error: "خطا در دریافت تامین‌کنندگان" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.insert(suppliers).values({
      code: data.code || null,
      name: data.name,
      phone: data.phone || null,
      mobile: data.mobile || null,
      email: data.email || null,
      address: data.address || null,
      nationalId: data.nationalId || null,
      economicCode: data.economicCode || null,
      balance: "0",
      notes: data.notes || null,
      isActive: true,
    }).returning();
    return NextResponse.json({ supplier: result[0] });
  } catch (error) {
    console.error("Error creating supplier:", error);
    return NextResponse.json({ error: "خطا در ثبت تامین‌کننده" }, { status: 500 });
  }
}
