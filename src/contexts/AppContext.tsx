"use client";
import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Permission } from "@/lib/utils";

interface User {
  id: number;
  name: string;
  username: string;
  roleId: number | null;
  roleName: string;
  permissions: Record<string, boolean>;
  avatar: string;
}

interface AppSettings {
  currency: string;
  companyName: string;
  companyPhone: string;
  companyAddress: string;
  taxPercent: string;
  invoiceFooter: string;
}

interface AppContextType {
  user: User | null;
  settings: AppSettings;
  setUser: (user: User | null) => void;
  loadSettings: () => Promise<void>;
  can: (permission: Permission) => boolean;
  currency: string;
  isAdmin: boolean;
}

const defaultSettings: AppSettings = {
  currency: "toman",
  companyName: "شرکت من",
  companyPhone: "",
  companyAddress: "",
  taxPercent: "0",
  invoiceFooter: "با تشکر از خرید شما",
};

const AppContext = createContext<AppContextType>({
  user: null,
  settings: defaultSettings,
  setUser: () => {},
  loadSettings: async () => {},
  can: () => false,
  currency: "toman",
  isAdmin: false,
});

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [user, setUserState] = useState<User | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data.settings }));
      }
    } catch {}
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          if (data.user) setUserState(data.user);
        }
      } catch {}
      setLoaded(true);
    };
    checkSession();
    loadSettings();
  }, [loadSettings]);

  const setUser = (u: User | null) => {
    setUserState(u);
  };

  const can = (permission: Permission): boolean => {
    if (!user) return false;
    if (user.roleName === "مدیر سیستم" || user.username === "admin") return true;
    return user.permissions[permission] === true;
  };

  if (!loaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50" dir="rtl">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">در حال بارگذاری...</p>
        </div>
      </div>
    );
  }

  return (
    <AppContext.Provider
      value={{
        user,
        settings,
        setUser,
        loadSettings,
        can,
        currency: settings.currency || "toman",
        isAdmin: user?.username === "admin" || user?.roleName === "مدیر سیستم",
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
