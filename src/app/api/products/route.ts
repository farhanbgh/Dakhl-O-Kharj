import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { products, productCategories } from "@/db/schema";
import { eq, ilike, or, desc } from "drizzle-orm";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const categoryId = searchParams.get("categoryId");
    const active = searchParams.get("active");

    let query = db
      .select({
        id: products.id,
        code: products.code,
        name: products.name,
        categoryId: products.categoryId,
        categoryName: productCategories.name,
        unit: products.unit,
        purchasePrice: products.purchasePrice,
        salePrice: products.salePrice,
        stock: products.stock,
        minStock: products.minStock,
        description: products.description,
        barcode: products.barcode,
        isActive: products.isActive,
        createdAt: products.createdAt,
      })
      .from(products)
      .leftJoin(productCategories, eq(products.categoryId, productCategories.id));

    const conditions = [];
    if (active !== "all") {
      conditions.push(eq(products.isActive, true));
    }
    if (categoryId) {
      conditions.push(eq(products.categoryId, parseInt(categoryId)));
    }
    if (search) {
      conditions.push(
        or(
          ilike(products.name, `%${search}%`),
          ilike(products.code, `%${search}%`),
          ilike(products.barcode, `%${search}%`)
        )
      );
    }

    const result = conditions.length > 0
      ? await query.where(conditions.length === 1 ? conditions[0] : conditions.reduce((a, b) => a && b))
          .orderBy(desc(products.createdAt))
      : await query.orderBy(desc(products.createdAt));

    return NextResponse.json({ products: result });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "خطا در دریافت کالاها" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.insert(products).values({
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
    }).returning();

    return NextResponse.json({ product: result[0] });
  } catch (error: unknown) {
    console.error("Error creating product:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "کد کالا تکراری است" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطا در ثبت کالا" }, { status: 500 });
  }
}
