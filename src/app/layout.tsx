import type { Metadata } from "next";
import "./globals.css";
import AutoPersianNumbers from "./components/AutoPersianNumbers";
import { AuthProvider } from "./context/AuthContext";

export const metadata: Metadata = {
  title: "Vira Translate",
  description: "vira translate",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body
        className="antialiased font-samim"
        style={{ fontFamily: '"Samim", "Tahoma", "Arial", "Helvetica", sans-serif' }}
      >
        <AuthProvider>
          {children}
          <AutoPersianNumbers />
        </AuthProvider>
      </body>
    </html>
  );
}
