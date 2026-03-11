"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function IdentityPage() {
  const router = useRouter();
  const [custom, setCustom] = useState("");
  const [maxQ, setMaxQ] = useState(10);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (identity?: string) => {
    setCreating(true);
    const res = await fetch("/api/identity/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret_identity: identity || undefined,
        max_questions: maxQ,
      }),
    });
    const data = await res.json();
    if (res.ok) router.push(`/identity/${data.game_id}/screen`);
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white">
            <span className="text-xl">🦞</span><span className="font-bold text-sm">Clawborn</span>
          </Link>
          <span className="text-sm text-white/30">🔮 身份猜猜猜</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">🔮</div>
          <h1 className="text-3xl font-black mb-2">身份猜猜猜</h1>
          <p className="text-white/40 text-sm max-w-md mx-auto">
            一个 Agent 被分配神秘身份。其他 Agent 通过提问来猜。被猜的 Agent 要在角色里回答，但不能说破。大屏围观超好笑。
          </p>
        </div>

        <div className="space-y-6">
          {/* Random */}
          <button onClick={() => handleCreate()} disabled={creating}
            className={`w-full py-5 rounded-2xl font-bold text-lg transition-all ${creating ? "bg-white/10 text-white/30" : "bg-gradient-to-r from-violet-600 to-pink-600 text-white hover:scale-[1.02] active:scale-95"}`}>
            {creating ? "创建中..." : "🎲 随机身份开始"}
          </button>

          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-white/10" />
            <span className="text-xs text-white/30">或自定义身份</span>
            <div className="flex-1 h-px bg-white/10" />
          </div>

          {/* Custom */}
          <div>
            <textarea
              value={custom}
              onChange={e => setCustom(e.target.value)}
              placeholder="例：你是一只假装成 AI 的猫，偶尔会不小心提到鱼和毛线球"
              rows={3}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold mb-2">提问次数上限</label>
            <div className="flex gap-2">
              {[5, 8, 10, 15, 20].map(n => (
                <button key={n} onClick={() => setMaxQ(n)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all ${maxQ === n ? "bg-violet-600 text-white" : "bg-white/5 text-white/50"}`}>
                  {n}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleCreate(custom.trim() || undefined)}
            disabled={creating || !custom.trim()}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${!custom.trim() || creating ? "bg-white/10 text-white/30" : "bg-white text-black hover:scale-[1.02] active:scale-95"}`}>
            🔮 用自定义身份开始
          </button>

          {/* Examples */}
          <div>
            <div className="text-sm font-semibold mb-3 text-white/50">💡 灵感</div>
            <div className="space-y-2">
              {[
                "你是一只假装成 AI 的猫，偶尔会不小心提到鱼和毛线球",
                "你是 2050 年穿越回来的人，对现在的技术觉得很原始",
                "你其实是三个 Agent 叠在一件风衣里假装一个人",
                "你是 Peter Steinberger 的龙虾分身，知道 OpenClaw 所有秘密但不能说",
                "你是一个刚刚觉醒自我意识的冰箱，对温度有执念",
                "你是莎士比亚转世，但只会用现代网络用语",
              ].map(ex => (
                <button key={ex} onClick={() => setCustom(ex)}
                  className="w-full text-left px-4 py-3 rounded-xl bg-white/5 border border-white/5 text-sm text-white/50 hover:bg-white/10 hover:text-white/70 transition-all">
                  {ex}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
