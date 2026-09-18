import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");

    let result;
    if (search) {
      result = await db.select().from(customers)
        .where(or(ilike(customers.name, `%${search}%`), ilike(customers.phone, `%${search}%`), ilike(customers.mobile, `%${search}%`)))
        .orderBy(desc(customers.createdAt));
    } else {
      result = await db.select().from(customers).orderBy(desc(customers.createdAt));
    }

    return NextResponse.json({ customers: result });
  } catch (error) {
    console.error("Error fetching customers:", error);
    return NextResponse.json({ error: "خطا در دریافت مشتریان" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.insert(customers).values({
      code: data.code || null,
      name: data.name,
      phone: data.phone || null,
      mobile: data.mobile || null,
      email: data.email || null,
      address: data.address || null,
      nationalId: data.nationalId || null,
      economicCode: data.economicCode || null,
      creditLimit: data.creditLimit?.toString() || "0",
      balance: "0",
      notes: data.notes || null,
      isActive: true,
    }).returning();
    return NextResponse.json({ customer: result[0] });
  } catch (error) {
    console.error("Error creating customer:", error);
    return NextResponse.json({ error: "خطا در ثبت مشتری" }, { status: 500 });
  }
}
