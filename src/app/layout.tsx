import type { Metadata } from "next";
import "./globals.css";
import { AppProvider } from "@/contexts/AppContext";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "سیستم حسابداری فروشگاهی",
  description: "نرم افزار مدیریت فاکتور و انبار",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-vazir antialiased bg-gray-50">
        <AppProvider>
          {children}
          <Toaster
            position="top-center"
            toastOptions={{
              duration: 3000,
              style: {
                fontFamily: "Vazirmatn, sans-serif",
                direction: "rtl",
                fontSize: "14px",
              },
            }}
          />
        </AppProvider>
      </body>
    </html>
  );
}
