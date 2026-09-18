import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { settings } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  try {
    const result = await db.select().from(settings);
    const obj: Record<string, string> = {};
    for (const row of result) {
      obj[row.key] = row.value;
    }
    return NextResponse.json({ settings: obj });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return NextResponse.json({ error: "خطا در دریافت تنظیمات" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    for (const [key, value] of Object.entries(data)) {
      await db
        .insert(settings)
        .values({ key, value: String(value) })
        .onConflictDoUpdate({ target: settings.key, set: { value: String(value), updatedAt: new Date() } });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "خطا در ذخیره تنظیمات" }, { status: 500 });
  }
}
