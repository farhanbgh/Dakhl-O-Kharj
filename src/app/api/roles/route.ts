import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { roles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(roles).orderBy(roles.name);
    return NextResponse.json({ roles: result });
  } catch (error) {
    console.error("Error fetching roles:", error);
    return NextResponse.json({ error: "خطا در دریافت نقش‌ها" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.insert(roles).values({
      name: data.name,
      displayName: data.displayName,
      permissions: data.permissions || {},
      isSystem: false,
    }).returning();
    return NextResponse.json({ role: result[0] });
  } catch (error) {
    console.error("Error creating role:", error);
    return NextResponse.json({ error: "خطا در ثبت نقش" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.update(roles).set({
      displayName: data.displayName,
      permissions: data.permissions || {},
    }).where(eq(roles.id, data.id)).returning();
    return NextResponse.json({ role: result[0] });
  } catch (error) {
    console.error("Error updating role:", error);
    return NextResponse.json({ error: "خطا در ویرایش نقش" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    const role = await db.select().from(roles).where(eq(roles.id, parseInt(id))).limit(1);
    if (role[0]?.isSystem) {
      return NextResponse.json({ error: "نقش سیستمی قابل حذف نیست" }, { status: 400 });
    }
    await db.delete(roles).where(eq(roles.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting role:", error);
    return NextResponse.json({ error: "خطا در حذف نقش" }, { status: 500 });
  }
}
