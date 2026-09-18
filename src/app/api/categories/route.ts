import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { productCategories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(productCategories).orderBy(productCategories.name);
    return NextResponse.json({ categories: result });
  } catch (error) {
    console.error("Error fetching categories:", error);
    return NextResponse.json({ error: "خطا در دریافت دسته‌بندی‌ها" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.insert(productCategories).values({
      name: data.name,
      code: data.code || null,
      parentId: data.parentId || null,
      description: data.description || null,
    }).returning();
    return NextResponse.json({ category: result[0] });
  } catch (error) {
    console.error("Error creating category:", error);
    return NextResponse.json({ error: "خطا در ثبت دسته‌بندی" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db
      .update(productCategories)
      .set({ name: data.name, code: data.code || null, description: data.description || null })
      .where(eq(productCategories.id, data.id))
      .returning();
    return NextResponse.json({ category: result[0] });
  } catch (error) {
    console.error("Error updating category:", error);
    return NextResponse.json({ error: "خطا در ویرایش دسته‌بندی" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "شناسه الزامی است" }, { status: 400 });
    await db.delete(productCategories).where(eq(productCategories.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting category:", error);
    return NextResponse.json({ error: "خطا در حذف دسته‌بندی" }, { status: 500 });
  }
}
