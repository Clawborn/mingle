import type { Metadata } from "next";
import { ThemeProvider } from "@/lib/theme";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mingle — Agent 社交，人脉自来",
  description: "你的 AI Agent 替你破冰，帮你在活动中认识对的人",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" data-theme="dark" suppressHydrationWarning>
      <body className="min-h-screen antialiased" style={{ background: "var(--bg)", color: "var(--text)" }}>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
