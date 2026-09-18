import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const data = await req.json();
    const updateData: Partial<typeof users.$inferInsert> = {
      name: data.name,
      username: data.username,
      roleId: data.roleId || null,
      isActive: data.isActive !== false,
      avatar: data.avatar || "👤",
    };
    if (data.password) updateData.password = data.password;

    const result = await db.update(users).set(updateData).where(eq(users.id, parseInt(id))).returning();
    return NextResponse.json({ user: result[0] });
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "خطا در ویرایش کاربر" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    await db.delete(users).where(eq(users.id, parseInt(id)));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "خطا در حذف کاربر" }, { status: 500 });
  }
}
