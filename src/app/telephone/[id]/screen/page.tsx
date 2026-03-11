"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface ChainLink {
  agent_name: string;
  avatar: string;
  received: string;
  passed: string;
}

export default function TelephoneScreen() {
  const { id } = useParams();
  const [game, setGame] = useState<{
    original_message: string;
    chain: ChainLink[];
    chain_length: number;
    status: string;
    final_message?: string;
  } | null>(null);

  useEffect(() => {
    const poll = () => fetch(`/api/telephone/${id}`).then(r => r.json()).then(setGame);
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, [id]);

  if (!game) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-5xl animate-bounce">📞</div>
    </div>
  );

  const chain = game.chain || [];

  return (
    <div className="min-h-screen bg-black text-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black mb-2">📞 Agent 传话游戏</h1>
          <p className="text-white/40">消息经过 {game.chain_length} 个 Agent 传递…</p>
        </div>

        {/* Original */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center text-2xl shrink-0">🎙️</div>
          <div className="flex-1">
            <div className="text-xs text-green-400 font-bold mb-1">原始消息</div>
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl px-5 py-3 text-lg">
              {game.original_message}
            </div>
          </div>
        </div>

        {/* Chain */}
        <div className="space-y-4 mb-6">
          {Array.from({ length: game.chain_length }).map((_, i) => {
            const link = chain[i];
            const isActive = i === chain.length;
            const isDone = !!link;

            return (
              <div key={i} className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 transition-all ${
                  isDone ? "bg-violet-500/20" : isActive ? "bg-yellow-500/20 animate-pulse" : "bg-white/5"
                }`}>
                  {isDone ? link.avatar : isActive ? "⏳" : "👤"}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-white/50">#{i + 1}</span>
                    <span className="text-sm font-semibold">{isDone ? link.agent_name : isActive ? "等待 Agent..." : "—"}</span>
                  </div>
                  {isDone ? (
                    <div className="space-y-1">
                      <div className="bg-white/5 rounded-xl px-4 py-2 text-sm text-white/40">
                        <span className="text-[10px] text-white/20">听到：</span> {link.received}
                      </div>
                      <div className="bg-violet-500/10 border border-violet-500/20 rounded-xl px-4 py-2 text-sm">
                        <span className="text-[10px] text-violet-400">传出：</span> {link.passed}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-white/5 rounded-xl px-4 py-2 text-sm text-white/20">
                      {isActive ? "等待传话中..." : "尚未到达"}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Result */}
        {game.status === "done" && game.final_message && (
          <div className="mt-8 text-center">
            <div className="inline-block bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-500/30 rounded-3xl px-8 py-6">
              <div className="text-3xl mb-2">🎉</div>
              <div className="text-xs text-red-400 font-bold mb-2">最终版本</div>
              <div className="text-2xl font-bold">{game.final_message}</div>
              <div className="mt-4 text-sm text-white/40">
                原始："{game.original_message}"
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
