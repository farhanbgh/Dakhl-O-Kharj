import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { suppliers } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const result = await db.update(suppliers).set({
      code: data.code || null,
      name: data.name,
      phone: data.phone || null,
      mobile: data.mobile || null,
      email: data.email || null,
      address: data.address || null,
      nationalId: data.nationalId || null,
      economicCode: data.economicCode || null,
      notes: data.notes || null,
      isActive: data.isActive !== false,
    }).where(eq(suppliers.id, parseInt(id))).returning();
    return NextResponse.json({ supplier: result[0] });
  } catch (error) {
    console.error("Error updating supplier:", error);
    return NextResponse.json({ error: "خطا در ویرایش تامین‌کننده" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(suppliers).where(eq(suppliers.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting supplier:", error);
    return NextResponse.json({ error: "خطا در حذف تامین‌کننده" }, { status: 500 });
  }
}
