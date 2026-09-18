import { NextResponse } from "next/server";
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
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.isActive, true));

    return NextResponse.json({ users: result });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "خطا در دریافت کاربران" }, { status: 500 });
  }
}
