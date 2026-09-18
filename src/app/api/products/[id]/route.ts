import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const result = await db
      .update(products)
      .set({
        code: data.code,
        name: data.name,
        categoryId: data.categoryId || null,
        unit: data.unit || "عدد",
        purchasePrice: data.purchasePrice?.toString() || "0",
        salePrice: data.salePrice?.toString() || "0",
        stock: data.stock?.toString() || "0",
        minStock: data.minStock?.toString() || "0",
        description: data.description || null,
        barcode: data.barcode || null,
        isActive: data.isActive !== false,
        updatedAt: new Date(),
      })
      .where(eq(products.id, parseInt(id)))
      .returning();

    return NextResponse.json({ product: result[0] });
  } catch (error) {
    console.error("Error updating product:", error);
    return NextResponse.json({ error: "خطا در ویرایش کالا" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(products).where(eq(products.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "خطا در حذف کالا" }, { status: 500 });
  }
}
