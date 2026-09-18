"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useApp } from "@/contexts/AppContext";
import toast from "react-hot-toast";
import { APP_VERSION } from "@/lib/utils";

interface UserItem {
  id: number;
  name: string;
  username: string;
  avatar: string;
  roleName: string;
}

const AVATARS = ["👤", "👨‍💼", "👩‍💼", "🧑‍💻", "👨‍🔧", "👩‍🔧", "🧑‍🏫", "👨‍💻"];

export default function LoginPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [logging, setLogging] = useState(false);
  const { setUser, user } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (user) {
      router.replace("/dashboard");
      return;
    }
    fetchUsers();
  }, [user, router]);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/auth/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch {
      toast.error("خطا در دریافت کاربران");
    }
    setLoading(false);
  };

  const handleLogin = async (u: UserItem) => {
    setSelectedUser(u);
    setLogging(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: u.id }),
      });
      const data = await res.json();
      if (res.ok) {
        setUser(data.user);
        toast.success(`خوش آمدید، ${u.name}!`);
        router.replace("/dashboard");
      } else {
        toast.error(data.error || "خطا در ورود");
      }
    } catch {
      toast.error("خطا در اتصال به سرور");
    }
    setLogging(false);
    setSelectedUser(null);
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900"
      dir="rtl"
    >
      <div className="w-full max-w-md px-4">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-white rounded-2xl shadow-2xl flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🏪</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-1">سیستم حسابداری</h1>
          <p className="text-blue-200 text-sm">نسخه {APP_VERSION}</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-2 text-center">انتخاب کاربر</h2>
          <p className="text-gray-500 text-sm text-center mb-6">
            برای ورود، کاربر خود را انتخاب کنید
          </p>

          {loading ? (
            <div className="text-center py-8">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
              <p className="text-gray-500 text-sm">در حال بارگذاری...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 text-4xl mb-3">😕</p>
              <p className="text-gray-600 font-medium">کاربری یافت نشد</p>
              <p className="text-gray-400 text-sm mt-1">لطفاً با مدیر سیستم تماس بگیرید</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => handleLogin(u)}
                  disabled={logging}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 transition-all duration-200
                    ${selectedUser?.id === u.id
                      ? "border-blue-500 bg-blue-50 shadow-lg scale-95"
                      : "border-gray-200 hover:border-blue-300 hover:bg-blue-50 hover:shadow-md"
                    }
                    ${logging ? "opacity-60 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  <span className="text-4xl mb-2">{u.avatar || "👤"}</span>
                  <span className="font-bold text-gray-800 text-sm text-center leading-tight">{u.name}</span>
                  <span className="text-xs text-gray-400 mt-1">{u.roleName || "کاربر"}</span>
                  {selectedUser?.id === u.id && logging && (
                    <div className="mt-2 w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <p className="text-center text-blue-200 text-xs mt-6">
          طراحی و توسعه با ❤️ برای کسب‌وکار شما
        </p>
      </div>
    </div>
  );
}
