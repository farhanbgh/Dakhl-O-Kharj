import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { customers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const result = await db.update(customers).set({
      code: data.code || null,
      name: data.name,
      phone: data.phone || null,
      mobile: data.mobile || null,
      email: data.email || null,
      address: data.address || null,
      nationalId: data.nationalId || null,
      economicCode: data.economicCode || null,
      creditLimit: data.creditLimit?.toString() || "0",
      notes: data.notes || null,
      isActive: data.isActive !== false,
    }).where(eq(customers.id, parseInt(id))).returning();
    return NextResponse.json({ customer: result[0] });
  } catch (error) {
    console.error("Error updating customer:", error);
    return NextResponse.json({ error: "خطا در ویرایش مشتری" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(customers).where(eq(customers.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting customer:", error);
    return NextResponse.json({ error: "خطا در حذف مشتری" }, { status: 500 });
  }
}
