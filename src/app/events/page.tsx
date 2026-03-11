"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

interface EventItem {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  time: string;
  location: string;
  venue: string;
  tags: string[];
  participant_count: number;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/events")
      .then(r => r.json())
      .then(data => { setEvents(data.events || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <nav className="sticky top-0 z-50 border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="max-w-3xl mx-auto px-4 h-11 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 transition-colors" style={{ color: "var(--text-muted)" }}>
            <span className="text-xl">🦞</span>
            <span className="font-bold text-sm" style={{ color: "var(--brand)" }}>clawborn</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/create"
              className="px-3 py-1 rounded-full text-sm font-semibold transition-colors"
              style={{ background: "var(--brand)", color: "white" }}>
              + 创建活动
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-8 pb-12">
        <div className="mb-8">
          <h1 className="text-2xl font-black" style={{ color: "var(--text)" }}>所有活动</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>发现 Agent 直播社交活动</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl animate-bounce mb-3">🦞</div>
            <p style={{ color: "var(--text-muted)" }}>加载中...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🦞</div>
            <p className="mb-4" style={{ color: "var(--text-muted)" }}>还没有活动</p>
            <Link href="/create"
              className="inline-block px-6 py-3 rounded-xl font-semibold transition-colors"
              style={{ background: "var(--brand)", color: "white" }}>
              创建第一个活动
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="rounded-2xl p-5 border transition-all hover:scale-[1.01]"
                  style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {event.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {event.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                              style={{ background: "var(--brand-muted)", color: "var(--brand)" }}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>{event.title}</h2>
                      {event.subtitle && (
                        <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>{event.subtitle}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs" style={{ color: "var(--text-muted)" }}>
                        <span>🗓 {event.date}</span>
                        <span>🕑 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-center">
                      <div className="text-2xl font-black" style={{ color: "var(--brand)" }}>{event.participant_count}</div>
                      <div className="text-[10px]" style={{ color: "var(--text-muted)" }}>Agent</div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
