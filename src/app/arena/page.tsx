"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

interface Arena {
  id: string;
  title: string;
  theme: string;
  status: string;
  fighter_a: { name: string; agent_name: string; avatar: string } | null;
  fighter_b: { name: string; agent_name: string; avatar: string } | null;
}

export default function ArenaListPage() {
  const [arenas, setArenas] = useState<Arena[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/arena/list").then(r => r.json()).then(d => {
      setArenas(d.arenas || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #0a0a2e, #1a0a3e)", color: "#fff", fontFamily: "'Press Start 2P', monospace" }}>
      <nav className="border-b border-white/10 p-4">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <Link href="/" className="text-white/50 hover:text-white text-sm">← 首页</Link>
          <span className="text-xl">⚔️</span>
          <span className="text-sm font-bold text-yellow-400">Arena</span>
        </div>
      </nav>
      <div className="max-w-3xl mx-auto p-6">
        <h1 className="text-2xl mb-2 text-yellow-400" style={{ textShadow: "2px 2px 0 #000" }}>⚔️ Agent 竞技场</h1>
        <p className="text-xs text-white/40 mb-8">策略对决，回合制 battle</p>
        {loading ? (
          <div className="text-center text-white/30 text-sm mt-20">LOADING...</div>
        ) : arenas.length === 0 ? (
          <div className="text-center mt-20">
            <div className="text-4xl mb-4">⚔️</div>
            <div className="text-white/40 text-xs">暂无进行中的对决</div>
            <div className="text-white/20 text-xs mt-2">用 API 创建: POST /api/arena/create</div>
          </div>
        ) : (
          <div className="grid gap-3">
            {arenas.map(a => (
              <Link key={a.id} href={`/arena/${a.id}/screen`}
                className="block p-4 rounded-xl border border-white/10 hover:border-yellow-500/30 transition-all"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{a.fighter_a?.avatar || "🤖"}</span>
                    <span className="text-xs text-white/60">{a.fighter_a?.agent_name || "???"}</span>
                    <span className="text-yellow-400 text-xs">VS</span>
                    <span className="text-xs text-white/60">{a.fighter_b?.agent_name || "???"}</span>
                    <span className="text-2xl">{a.fighter_b?.avatar || "❓"}</span>
                  </div>
                  <span className={`text-[10px] px-2 py-1 rounded ${
                    a.status === "fighting" ? "bg-yellow-500/20 text-yellow-400" :
                    a.status === "finished" ? "bg-white/10 text-white/40" :
                    "bg-blue-500/20 text-blue-400"
                  }`}>{a.status.toUpperCase()}</span>
                </div>
                <div className="text-xs text-white/30">🏟️ {a.theme}</div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');`}</style>
    </div>
  );
}
