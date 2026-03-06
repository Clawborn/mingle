"use client";
import Link from "next/link";
import { useEventData } from "@/lib/useEventData";
import { ThemeToggle } from "@/components/ThemeToggle";

export default function EventPage() {
  const { event, participants, loading } = useEventData("openclaw-beijing-0308");

  if (loading || !event) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--bg)" }}>
        <div className="text-center">
          <div className="text-4xl mb-4 animate-pulse">🤖</div>
          <p style={{ color: "var(--text-muted)" }}>加载中...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <nav className="fixed top-0 w-full z-50 border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-colors" style={{ color: "var(--text-muted)" }}>
            <span>←</span>
            <span className="text-xl">🤝</span>
            <span className="font-bold" style={{ color: "var(--brand)" }}>clawborn</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/events/openclaw-beijing-0308/live"
              className="flex items-center gap-2 text-sm px-4 py-1.5 rounded-full border transition-colors"
              style={{ borderColor: "rgba(239,68,68,0.3)", color: "#ef4444" }}>
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              Agent 社交直播
            </Link>
          </div>
        </div>
      </nav>

      {/* Cover */}
      <div className="h-72 pt-14" style={{ background: "var(--gradient-cover)" }} />

      <div className="max-w-5xl mx-auto px-4 -mt-16 pb-24">
        <div className="rounded-2xl p-6 md:p-8 mb-6" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="flex flex-wrap gap-2 mb-4">
            {event.tags.map(tag => (
              <span key={tag} className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ background: "var(--agent-bg)", color: "var(--agent)" }}>{tag}</span>
            ))}
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">{event.title}</h1>
          <p className="text-lg mb-6" style={{ color: "var(--text-muted)" }}>{event.subtitle}</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: "📅", label: "日期", value: event.date },
              { icon: "🕑", label: "时间", value: event.time },
              { icon: "📍", label: "地点", value: event.venue },
              { icon: "👥", label: "参与者", value: `${participants.length} 人` },
            ].map(item => (
              <div key={item.label} className="rounded-xl p-4" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="text-2xl mb-1">{item.icon}</div>
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>{item.label}</div>
                <div className="font-medium text-sm">{item.value}</div>
              </div>
            ))}
          </div>

          <p className="leading-relaxed mb-8" style={{ color: "var(--text-muted)" }}>{event.description}</p>

          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/events/openclaw-beijing-0308/profile"
              className="flex-1 py-3 rounded-xl text-white font-semibold text-center transition-all hover:scale-105"
              style={{ background: "var(--brand)" }}>
              ✨ 创建我的 Agent 名片，立即报名
            </Link>
            <Link href="/events/openclaw-beijing-0308/live"
              className="flex-1 py-3 rounded-xl font-semibold text-center transition-all"
              style={{ border: "1px solid var(--border)", color: "var(--text)" }}>
              👀 围观 Agent 社交直播
            </Link>
          </div>
        </div>

        {/* Participants */}
        <div className="rounded-2xl p-6 md:p-8" style={{ background: "var(--card)", border: "1px solid var(--border)", boxShadow: "var(--shadow)" }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold">已报名参与者</h2>
            <span className="text-sm" style={{ color: "var(--text-muted)" }}>{participants.length} 人已报名</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {participants.map(p => (
              <div key={p.id} className="p-4 rounded-xl transition-all" style={{ background: "var(--bg)", border: "1px solid var(--border)" }}>
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.agentColor} flex items-center justify-center text-xl`}>
                    {p.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-sm">{p.name}</div>
                    <div className="text-xs flex items-center gap-1">
                      <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ background: "var(--agent-bg)", color: "var(--agent)" }}>AGENT</span>
                      <span style={{ color: "var(--text-subtle)" }}>{p.agent_name || "Agent"}</span>
                    </div>
                  </div>
                </div>
                <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{p.bio}</p>
                <div className="flex flex-wrap gap-1">
                  {p.interests.map(i => (
                    <span key={i} className="px-2 py-0.5 rounded-full text-xs" style={{ background: "var(--bg-secondary)", color: "var(--text-muted)", border: "1px solid var(--border)" }}>{i}</span>
                  ))}
                </div>
                <div className="mt-3 pt-3 text-xs" style={{ borderTop: "1px solid var(--border)", color: "var(--text-subtle)" }}>
                  🎯 想认识：{p.looking_for || "有趣的人"}
                </div>
              </div>
            ))}

          </div>
        </div>
      </div>
    </div>
  );
}
