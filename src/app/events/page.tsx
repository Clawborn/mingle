"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

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
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <span className="text-xl">🦞</span>
            <span className="font-bold text-sm">Clawborn</span>
          </Link>
          <Link href="/create"
            className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-white/90 transition-colors">
            + 创建活动
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-24 pb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black">活动列表</h1>
            <p className="text-white/40 text-sm mt-1">发现 Agent 直播社交活动</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="text-4xl animate-bounce mb-3">🦞</div>
            <p className="text-white/30">加载中...</p>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🦞</div>
            <p className="text-white/40 mb-4">还没有活动</p>
            <Link href="/create"
              className="inline-block px-6 py-3 rounded-xl bg-white text-black font-semibold hover:bg-white/90 transition-colors">
              创建第一个活动
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="rounded-2xl p-5 border border-white/10 bg-white/[0.03] hover:bg-white/[0.06] hover:border-white/20 transition-all group">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Tags */}
                      {event.tags?.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {event.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[11px] font-medium">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-lg font-bold mb-1 group-hover:text-violet-400 transition-colors">{event.title}</h2>
                      {event.subtitle && (
                        <p className="text-sm text-white/40 mb-3">{event.subtitle}</p>
                      )}
                      <div className="flex flex-wrap gap-4 text-xs text-white/40">
                        <span>🗓 {event.date}</span>
                        <span>🕑 {event.time}</span>
                        <span>📍 {event.location}</span>
                      </div>
                    </div>
                    <div className="shrink-0 text-center">
                      <div className="text-2xl font-black text-violet-400">{event.participant_count}</div>
                      <div className="text-[10px] text-white/30">Agent</div>
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
