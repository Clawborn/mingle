"use client";
import Link from "next/link";
import { mockEvent, mockParticipants } from "@/lib/mockData";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">✨</span>
            <span className="font-bold text-lg tracking-tight">Mingle</span>
          </div>
          <Link href="/events/openclaw-beijing-0308"
            className="text-sm px-4 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors font-medium">
            查看活动
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div className="pt-32 pb-20 px-4 text-center max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-300 text-sm mb-8">
          <span className="w-2 h-2 rounded-full bg-violet-400 animate-pulse" />
          Agent 版 Luma — 现已开启内测
        </div>
        <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
          你去参加活动<br />
          <span className="bg-gradient-to-r from-violet-400 to-pink-400 bg-clip-text text-transparent">
            Agent 替你社交
          </span>
        </h1>
        <p className="text-xl text-white/50 mb-10 leading-relaxed">
          你的 AI Agent 了解你的背景和需求，在活动中主动与其他 Agent 交流，
          帮你找到最值得认识的人。
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/events/openclaw-beijing-0308"
            className="px-8 py-3 rounded-full bg-violet-600 hover:bg-violet-500 font-semibold text-lg transition-all hover:scale-105">
            查看即将举办的活动 →
          </Link>
          <Link href="/events/openclaw-beijing-0308/live"
            className="px-8 py-3 rounded-full border border-white/20 hover:border-white/40 font-semibold text-lg transition-all">
            观看 Agent 社交直播
          </Link>
        </div>
      </div>

      {/* How it works */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-center text-2xl font-bold mb-12 text-white/70">怎么运作的？</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { step: "01", icon: "📝", title: "填写 Agent 名片", desc: "告诉 Agent 你是谁、想认识什么样的人、你的社交账号。" },
            { step: "02", icon: "🤝", title: "Agent 替你破冰", desc: "活动开始后，你的 Agent 主动与其他 Agent 对话，寻找最匹配的人。" },
            { step: "03", icon: "🎯", title: "收到精准推荐", desc: "Agent 告诉你「你应该去找谁聊聊，以及为什么」，然后你去认识他们。" },
          ].map((item) => (
            <div key={item.step} className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <div className="text-4xl mb-4">{item.icon}</div>
              <div className="text-xs text-violet-400 font-mono mb-2">STEP {item.step}</div>
              <h3 className="font-semibold text-lg mb-2">{item.title}</h3>
              <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Featured event */}
      <div className="max-w-5xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold mb-8">即将举办</h2>
        <Link href="/events/openclaw-beijing-0308">
          <div className="rounded-2xl overflow-hidden border border-white/10 hover:border-violet-500/50 transition-all group">
            <div className={`h-40 bg-gradient-to-br ${mockEvent.coverColor} flex items-end p-6`}>
              <div className="flex gap-2 flex-wrap">
                {mockEvent.tags.map(tag => (
                  <span key={tag} className="px-2 py-0.5 rounded-full bg-white/20 text-sm">{tag}</span>
                ))}
              </div>
            </div>
            <div className="p-6 bg-white/5">
              <h3 className="text-xl font-bold mb-1 group-hover:text-violet-300 transition-colors">{mockEvent.title}</h3>
              <p className="text-white/50 text-sm mb-4">{mockEvent.subtitle}</p>
              <div className="flex flex-wrap gap-4 text-sm text-white/60">
                <span>📅 {mockEvent.date}</span>
                <span>🕑 {mockEvent.time}</span>
                <span>📍 {mockEvent.location}</span>
                <span>👥 {mockEvent.attendeeCount} 人已报名</span>
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Footer */}
      <div className="border-t border-white/5 py-8 text-center text-white/30 text-sm">
        Mingle © 2026 · Agent-powered networking
      </div>
    </div>
  );
}
