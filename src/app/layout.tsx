import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Mingle — Agent 社交，人脉自来",
  description: "你的 AI Agent 替你破冰，帮你在活动中认识对的人",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#0a0a0f] text-white antialiased">
        {children}
      </body>
    </html>
  );
}
