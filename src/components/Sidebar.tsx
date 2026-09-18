"use client";
import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import toast from "react-hot-toast";
import { APP_VERSION } from "@/lib/utils";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  permission?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  { href: "/dashboard", label: "داشبورد", icon: "📊" },
  {
    href: "/invoices",
    label: "فاکتور فروش",
    icon: "🧾",
    children: [
      { href: "/invoices", label: "لیست فاکتورها", icon: "📋" },
      { href: "/invoices/new", label: "فاکتور جدید", icon: "➕" },
      { href: "/invoices/returns", label: "برگشت از فروش", icon: "↩️" },
    ],
  },
  {
    href: "/purchases",
    label: "فاکتور خرید",
    icon: "🛒",
    children: [
      { href: "/purchases", label: "لیست خریدها", icon: "📋" },
      { href: "/purchases/new", label: "خرید جدید", icon: "➕" },
      { href: "/purchases/returns", label: "برگشت از خرید", icon: "↩️" },
    ],
  },
  { href: "/payments", label: "پرداخت‌ها", icon: "💰" },
  { href: "/customers", label: "مشتریان", icon: "👥" },
  { href: "/suppliers", label: "تامین‌کنندگان", icon: "🏭" },
  {
    href: "/products",
    label: "کالاها",
    icon: "📦",
    children: [
      { href: "/products", label: "لیست کالاها", icon: "📋" },
      { href: "/products/categories", label: "دسته‌بندی‌ها", icon: "🏷️" },
    ],
  },
  { href: "/reports", label: "گزارشات", icon: "📈" },
  {
    href: "/settings",
    label: "تنظیمات",
    icon: "⚙️",
    children: [
      { href: "/settings", label: "تنظیمات سیستم", icon: "🔧" },
      { href: "/settings/users", label: "کاربران", icon: "👤" },
      { href: "/settings/roles", label: "نقش‌ها و دسترسی", icon: "🔐" },
      { href: "/settings/backup", label: "بکاپ", icon: "💾" },
    ],
  },
];

export default function Sidebar({ onClose }: { onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = useApp();
  const [openMenus, setOpenMenus] = useState<string[]>([]);

  const toggleMenu = (href: string) => {
    setOpenMenus((prev) =>
      prev.includes(href) ? prev.filter((h) => h !== href) : [...prev, href]
    );
  };

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    toast.success("خروج موفق");
    router.push("/login");
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-b from-slate-900 to-slate-800 text-white w-64">
      {/* Header */}
      <div className="px-4 py-4 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
            🏪
          </div>
          <div>
            <h1 className="font-bold text-sm leading-tight">سیستم حسابداری</h1>
            <p className="text-slate-400 text-xs">نسخه {APP_VERSION}</p>
          </div>
        </div>
      </div>

      {/* User Info */}
      {user && (
        <div className="px-4 py-3 bg-slate-800 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{user.avatar}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{user.name}</p>
              <p className="text-slate-400 text-xs truncate">{user.roleName}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav Items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navItems.map((item) => (
          <div key={item.href} className="mb-1">
            {item.children ? (
              <>
                <button
                  onClick={() => toggleMenu(item.href)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                    ${isActive(item.href) ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-700 hover:text-white"}
                  `}
                >
                  <span className="text-base">{item.icon}</span>
                  <span className="flex-1 text-right">{item.label}</span>
                  <span className={`text-xs transition-transform ${openMenus.includes(item.href) ? "rotate-90" : ""}`}>
                    ‹
                  </span>
                </button>
                {openMenus.includes(item.href) && (
                  <div className="mr-4 mt-1 border-r border-slate-600 pr-2">
                    {item.children.map((child) => (
                      <Link
                        key={child.href}
                        href={child.href}
                        onClick={onClose}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs my-0.5 transition-all
                          ${pathname === child.href
                            ? "bg-blue-500 text-white"
                            : "text-slate-400 hover:bg-slate-700 hover:text-white"
                          }
                        `}
                      >
                        <span>{child.icon}</span>
                        <span>{child.label}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-all
                  ${isActive(item.href)
                    ? "bg-blue-600 text-white shadow-lg"
                    : "text-slate-300 hover:bg-slate-700 hover:text-white"
                  }
                `}
              >
                <span className="text-base">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            )}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-2 py-3 border-t border-slate-700">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-all"
        >
          <span>🚪</span>
          <span>خروج از سیستم</span>
        </button>
      </div>
    </div>
  );
}
