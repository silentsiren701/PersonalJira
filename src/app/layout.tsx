import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ticket Record",
  description: "个人的、简化版私人 Jira Board",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="bg-slate-50 text-slate-900 antialiased">{children}</body>
    </html>
  );
}
