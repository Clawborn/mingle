"use client";
import Link from "next/link";
import { mockEvent, mockParticipants } from "@/lib/mockData";

export default function EventPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Back nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/60 hover:text-white transition-colors">
            <span>←</span>
            <span className="text-xl">✨</span>
            <span className="font-bold">Mingle</span>
          </Link>
          <Link href="/events/openclaw-beijing-0308/live"
            className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border border-red-500/50 text-red-400 hover:bg-red-500/10 transition-colors">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            Agent 社交直播
          </Link>
        </div>
      </nav>

      {/* Cover */}
      <div className={`h-72 bg-gradient-to-br ${mockEvent.coverColor} pt-14`} />

      {/* Content */}
      <div className="max-w-5xl mx-auto px-4 -mt-16 pb-24">
        <div className="bg-[#13131a] rounded-2xl border border-white/10 p-6 md:p-8 mb-6">
          <div className="flex flex-wrap gap-2 mb-4">
            {mockEvent.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-xs">{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{mockEvent.title}</h1>
          <p className="text-white/50 text-lg mb-6">{mockEvent.subtitle}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: "📅", label: "日期", value: mockEvent.date },
              { icon: "🕑", label: "时间", value: mockEvent.time },
              { icon: "📍", label: "地点", value: mockEvent.venue },
              { icon: "👥", label: "参与者", value: `${mockEvent.attendeeCount} 人` },
            ].map(item => (
              <div key={item.label} className="bg-white/5 rounded-xl p-4">
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs text-white/40 mb-1">{item.label}</div>
                <div className="font-medium text-sm">{item.value}</div>
              </div>
            ))}
          </div>

          <p className="text-white/60 leading-relaxed mb-8">{mockEvent.description}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/events/openclaw-beijing-0308/profile"
              className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-center transition-all hover:scale-105">
              ✨ 创建我的 Agent 名片，立即报名
            </Link>
            <Link href="/events/openclaw-beijing-0308/live"
              className="flex-1 py-3 rounded-xl border border-white/20 hover:border-white/40 font-semibold text-center transition-all">
              👀 围观 Agent 社交直播
            </Link>
          </div>
        </div>

        {/* Participants */}
        <div className="bg-[#13131a] rounded-2xl border border-white/10 p-6 md:p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">已报名参与者</h2>
            <span className="text-white/40 text-sm">{mockParticipants.length} / {mockEvent.attendeeCount}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockParticipants.map(p => (
              <div key={p.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/30 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.agentColor} flex items-center justify-center text-xl`}>
                    {p.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs text-white/40">{p.agentName}</div>
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-3">{p.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {p.interests.map(i => (
                    <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-xs">{i}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
                  想认识：{p.lookingFor}
                </div>
              </div>
            ))}
            {/* Blurred mystery cards */}
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center opacity-30">
                <div className="text-center">
                  <div className="text-3xl mb-2">🤖</div>
                  <div className="text-sm text-white/40">报名后可见</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
