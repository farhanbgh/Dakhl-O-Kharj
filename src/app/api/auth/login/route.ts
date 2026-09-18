import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { users, roles } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createSessionValue, SESSION_COOKIE_NAME } from "@/lib/session";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await req.json();

    const result = await db
      .select({
        id: users.id,
        name: users.name,
        username: users.username,
        avatar: users.avatar,
        roleId: users.roleId,
        roleName: roles.name,
        roleDisplayName: roles.displayName,
        permissions: roles.permissions,
        isActive: users.isActive,
      })
      .from(users)
      .leftJoin(roles, eq(users.roleId, roles.id))
      .where(eq(users.id, userId))
      .limit(1);

    if (!result.length) {
      return NextResponse.json({ error: "کاربر یافت نشد" }, { status: 404 });
    }

    const user = result[0];
    if (!user.isActive) {
      return NextResponse.json({ error: "کاربر غیرفعال است" }, { status: 403 });
    }

    const sessionUser = {
      id: user.id,
      name: user.name,
      username: user.username,
      roleId: user.roleId,
      roleName: user.roleDisplayName || "کاربر",
      permissions: (user.permissions as Record<string, boolean>) || {},
      avatar: user.avatar || "👤",
    };

    const sessionValue = createSessionValue(sessionUser);

    const response = NextResponse.json({ success: true, user: sessionUser });
    response.cookies.set(SESSION_COOKIE_NAME, sessionValue, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "خطا در ورود" }, { status: 500 });
  }
}
