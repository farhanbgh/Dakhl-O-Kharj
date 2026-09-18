import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        isActive: users.isActive,
        roleId: users.roleId,
        roleName: roles.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .orderBy(users.name);
    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "خطا در دریافت کاربران" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const result = await db.insert(users).values({
      name: data.name,
      username: data.username,
      password: data.password || "1234",
      roleId: data.roleId || null,
      isActive: data.isActive !== false,
      avatar: data.avatar || "👤",
    }).returning();
    return NextResponse.json({ user: result[0] });
  } catch (error: unknown) {
    console.error("Error creating user:", error);
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      return NextResponse.json({ error: "نام کاربری تکراری است" }, { status: 400 });
    }
    return NextResponse.json({ error: "خطا در ثبت کاربر" }, { status: 500 });
  }
}
