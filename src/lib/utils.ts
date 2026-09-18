import * as jalaali from "jalaali-js";

// ==================== PERSIAN NUMBERS ====================
export function toPersianNum(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return "";
  const persian = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"];
  return String(num).replace(/\d/g, (d) => persian[parseInt(d)]);
}

export function toEnglishNum(str: string): string {
  return str
    .replace(/[۰-۹]/g, (d) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(d)))
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)));
}

// ==================== CURRENCY FORMATTING ====================
export function formatCurrency(
  amount: number | string | null | undefined,
  currency: string = "toman"
): string {
  if (amount === null || amount === undefined) return toPersianNum("0");
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (isNaN(num)) return toPersianNum("0");

  let displayNum = num;
  if (currency === "toman") {
    // Already in toman or rial - just format
  }

  const formatted = displayNum.toLocaleString("en-US");
  return toPersianNum(formatted);
}

export function getCurrencyLabel(currency: string): string {
  return currency === "rial" ? "ریال" : "تومان";
}

// ==================== JALALI DATE ====================
export function toJalali(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  if (isNaN(d.getTime())) return "";
  const { jy, jm, jd } = jalaali.toJalaali(d);
  return `${jy}/${String(jm).padStart(2, "0")}/${String(jd).padStart(2, "0")}`;
}

export function toJalaliDisplay(date: Date | string | null | undefined): string {
  const j = toJalali(date);
  if (!j) return "";
  return toPersianNum(j);
}

export function jalaliToGregorian(jalaliStr: string): Date | null {
  try {
    const normalized = toEnglishNum(jalaliStr);
    const parts = normalized.split("/");
    if (parts.length !== 3) return null;
    const jy = parseInt(parts[0]);
    const jm = parseInt(parts[1]);
    const jd = parseInt(parts[2]);
    const { gy, gm, gd } = jalaali.toGregorian(jy, jm, jd);
    return new Date(gy, gm - 1, gd);
  } catch {
    return null;
  }
}

export function todayJalali(): string {
  return toJalali(new Date());
}

export function todayJalaliDisplay(): string {
  return toPersianNum(todayJalali());
}

export function jalaliMonthName(month: number): string {
  const months = [
    "فروردین", "اردیبهشت", "خرداد", "تیر", "مرداد", "شهریور",
    "مهر", "آبان", "آذر", "دی", "بهمن", "اسفند"
  ];
  return months[month - 1] || "";
}

export function formatJalaliDate(jalaliStr: string): string {
  if (!jalaliStr) return "";
  const parts = jalaliStr.split("/");
  if (parts.length !== 3) return jalaliStr;
  const [y, m, d] = parts;
  return `${toPersianNum(d)} ${jalaliMonthName(parseInt(m))} ${toPersianNum(y)}`;
}

// ==================== INVOICE NUMBER ====================
export function generateInvoiceNumber(prefix: string, lastNumber: number): string {
  const num = lastNumber + 1;
  return `${prefix}${String(num).padStart(5, "0")}`;
}

// ==================== PERMISSIONS ====================
export type Permission =
  | "dashboard.view"
  | "invoices.view"
  | "invoices.create"
  | "invoices.edit"
  | "invoices.delete"
  | "invoices.print"
  | "purchase.view"
  | "purchase.create"
  | "purchase.edit"
  | "purchase.delete"
  | "returns.view"
  | "returns.create"
  | "customers.view"
  | "customers.create"
  | "customers.edit"
  | "customers.delete"
  | "suppliers.view"
  | "suppliers.create"
  | "suppliers.edit"
  | "suppliers.delete"
  | "products.view"
  | "products.create"
  | "products.edit"
  | "products.delete"
  | "products.import"
  | "payments.view"
  | "payments.create"
  | "reports.view"
  | "reports.print"
  | "settings.view"
  | "settings.edit"
  | "users.view"
  | "users.create"
  | "users.edit"
  | "users.delete"
  | "roles.view"
  | "roles.edit"
  | "backup.create"
  | "backup.restore";

export const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: "dashboard.view", label: "مشاهده داشبورد", group: "داشبورد" },
  { key: "invoices.view", label: "مشاهده فاکتور فروش", group: "فاکتور فروش" },
  { key: "invoices.create", label: "ثبت فاکتور فروش", group: "فاکتور فروش" },
  { key: "invoices.edit", label: "ویرایش فاکتور فروش", group: "فاکتور فروش" },
  { key: "invoices.delete", label: "حذف فاکتور فروش", group: "فاکتور فروش" },
  { key: "invoices.print", label: "چاپ فاکتور فروش", group: "فاکتور فروش" },
  { key: "purchase.view", label: "مشاهده فاکتور خرید", group: "فاکتور خرید" },
  { key: "purchase.create", label: "ثبت فاکتور خرید", group: "فاکتور خرید" },
  { key: "purchase.edit", label: "ویرایش فاکتور خرید", group: "فاکتور خرید" },
  { key: "purchase.delete", label: "حذف فاکتور خرید", group: "فاکتور خرید" },
  { key: "returns.view", label: "مشاهده مرجوعی", group: "مرجوعی" },
  { key: "returns.create", label: "ثبت مرجوعی", group: "مرجوعی" },
  { key: "customers.view", label: "مشاهده مشتریان", group: "مشتریان" },
  { key: "customers.create", label: "افزودن مشتری", group: "مشتریان" },
  { key: "customers.edit", label: "ویرایش مشتری", group: "مشتریان" },
  { key: "customers.delete", label: "حذف مشتری", group: "مشتریان" },
  { key: "suppliers.view", label: "مشاهده تامین‌کنندگان", group: "تامین‌کنندگان" },
  { key: "suppliers.create", label: "افزودن تامین‌کننده", group: "تامین‌کنندگان" },
  { key: "suppliers.edit", label: "ویرایش تامین‌کننده", group: "تامین‌کنندگان" },
  { key: "suppliers.delete", label: "حذف تامین‌کننده", group: "تامین‌کنندگان" },
  { key: "products.view", label: "مشاهده کالاها", group: "کالاها" },
  { key: "products.create", label: "افزودن کالا", group: "کالاها" },
  { key: "products.edit", label: "ویرایش کالا", group: "کالاها" },
  { key: "products.delete", label: "حذف کالا", group: "کالاها" },
  { key: "products.import", label: "ایمپورت کالا", group: "کالاها" },
  { key: "payments.view", label: "مشاهده پرداخت‌ها", group: "پرداخت‌ها" },
  { key: "payments.create", label: "ثبت پرداخت", group: "پرداخت‌ها" },
  { key: "reports.view", label: "مشاهده گزارشات", group: "گزارشات" },
  { key: "reports.print", label: "چاپ گزارشات", group: "گزارشات" },
  { key: "settings.view", label: "مشاهده تنظیمات", group: "تنظیمات" },
  { key: "settings.edit", label: "ویرایش تنظیمات", group: "تنظیمات" },
  { key: "users.view", label: "مشاهده کاربران", group: "کاربران" },
  { key: "users.create", label: "افزودن کاربر", group: "کاربران" },
  { key: "users.edit", label: "ویرایش کاربر", group: "کاربران" },
  { key: "users.delete", label: "حذف کاربر", group: "کاربران" },
  { key: "roles.view", label: "مشاهده نقش‌ها", group: "نقش‌ها" },
  { key: "roles.edit", label: "ویرایش نقش‌ها", group: "نقش‌ها" },
  { key: "backup.create", label: "ایجاد بکاپ", group: "بکاپ" },
  { key: "backup.restore", label: "بازیابی بکاپ", group: "بکاپ" },
];

export function hasPermission(
  permissions: Record<string, boolean>,
  permission: Permission
): boolean {
  return permissions[permission] === true;
}

export const APP_VERSION = "1.0.0";
