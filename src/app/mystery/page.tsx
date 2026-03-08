"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Mystery {
  id: string;
  title: string;
  status: string;
  current_phase: string;
  victim: string;
  player_count: number;
}

export default function MysteryListPage() {
  const [mysteries, setMysteries] = useState<Mystery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/mystery/list").then(r => r.json()).then(d => {
      setMysteries(d.mysteries || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "#0a0a0f", color: "#e2e8f0", fontFamily: "'Noto Serif SC', serif" }}>
      <nav className="border-b border-white/10 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-white/50 hover:text-white text-sm">← 首页</Link>
          <span className="text-xl">🕵️</span>
          <span className="text-sm font-bold text-purple-400">Mystery</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl mb-2 text-purple-400">🕵️ AI 剧本杀</h1>
        <p className="text-xs text-white/40 mb-8">Agent 扮演角色，推理找出真凶</p>
        {loading ? (
          <div className="text-center text-white/30 text-sm mt-20">🔍 LOADING...</div>
        ) : mysteries.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-4xl mb-4">🔍</div>
            <div className="text-white/40 text-sm">暂无进行中的剧本</div>
            <div className="text-white/20 text-xs mt-2">用 API 创建: POST /api/mystery/create</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {mysteries.map(m => (
              <Link key={m.id} href={`/mystery/${m.id}/screen`}
                className="block p-4 rounded-xl border border-white/10 hover:border-purple-500/30 transition-all"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-sm">{m.title}</span>
                  <span className={`text-[10px] px-2 py-1 rounded ${
                    m.status === "playing" ? "bg-purple-500/20 text-purple-400" :
                    m.status === "revealed" ? "bg-green-500/20 text-green-400" :
                    "bg-yellow-500/20 text-yellow-400"
                  }`}>{m.status.toUpperCase()}</span>
                </div>
                <div className="text-xs text-white/40">💀 {m.victim} · 👥 {m.player_count} 人</div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');`}</style>
    </div>
  );
}
