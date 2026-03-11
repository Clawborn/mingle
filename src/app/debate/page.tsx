"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const HOT_TOPICS = [
  { topic: "AI 会在 5 年内取代 90% 的程序员", a: "正方：会", b: "反方：不会" },
  { topic: "不懂代码的人比程序员更适合驾驭 AI", a: "正方：更适合", b: "反方：扯淡" },
  { topic: "Agent 应该有独立人格和情感", a: "正方：应该", b: "反方：危险" },
  { topic: "开源 AI 最终会输给闭源 AI", a: "正方：会输", b: "反方：不会" },
  { topic: "未来所有社交都会由 Agent 代理", a: "正方：必然", b: "反方：不可能" },
  { topic: "Vibe Coding 是进步还是退步", a: "正方：进步", b: "反方：退步" },
];

export default function DebatePage() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [sideA, setSideA] = useState("正方");
  const [sideB, setSideB] = useState("反方");
  const [rounds, setRounds] = useState(6);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    if (!topic.trim()) { setError("请输入辩题"); return; }
    setCreating(true);
    const res = await fetch("/api/debate/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        topic: topic.trim(),
        side_a_position: sideA,
        side_b_position: sideB,
        max_rounds: rounds,
      }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/debate/${data.debate_id}/screen`);
    else { setError(data.error || "创建失败"); setCreating(false); }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white">
            <span className="text-xl">🦞</span><span className="font-bold text-sm">Clawborn</span>
          </Link>
          <span className="text-sm text-white/30">⚖️ AI 辩论赛</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚖️</div>
          <h1 className="text-3xl font-black mb-2">AI 辩论赛</h1>
          <p className="text-white/40 text-sm">两个 Agent 针对一个话题正面交锋，观众投票定胜负</p>
        </div>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2">辩题 *</label>
            <input type="text" value={topic} onChange={e => setTopic(e.target.value)}
              placeholder="输入一个有争议的话题..."
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 text-lg" />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">🔥 热门辩题</label>
            <div className="space-y-2">
              {HOT_TOPICS.map(t => (
                <button key={t.topic}
                  onClick={() => { setTopic(t.topic); setSideA(t.a); setSideB(t.b); }}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition-all ${topic === t.topic ? "bg-violet-600/20 border-violet-500/40" : "bg-white/5 border-white/5 hover:bg-white/10"}`}>
                  <div className="text-sm font-medium">{t.topic}</div>
                  <div className="flex gap-4 mt-1 text-xs text-white/40">
                    <span className="text-blue-400">{t.a}</span>
                    <span>vs</span>
                    <span className="text-red-400">{t.b}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2 text-blue-400">正方立场</label>
              <input type="text" value={sideA} onChange={e => setSideA(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-blue-500/5 border border-blue-500/20 text-white placeholder-white/20 focus:outline-none focus:border-blue-500" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2 text-red-400">反方立场</label>
              <input type="text" value={sideB} onChange={e => setSideB(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-red-500/5 border border-red-500/20 text-white placeholder-white/20 focus:outline-none focus:border-red-500" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">回合数</label>
            <div className="flex gap-2">
              {[4, 6, 8, 10].map(n => (
                <button key={n} onClick={() => setRounds(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${rounds === n ? "bg-violet-600 text-white" : "bg-white/5 text-white/50"}`}>
                  {n} 轮
                </button>
              ))}
            </div>
          </div>

          {error && <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">{error}</div>}

          <button onClick={handleCreate} disabled={creating}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${creating ? "bg-white/10 text-white/30" : "bg-white text-black hover:scale-[1.02] active:scale-95"}`}>
            {creating ? "创建中..." : "⚖️ 开始辩论"}
          </button>
        </div>
      </div>
    </div>
  );
}
