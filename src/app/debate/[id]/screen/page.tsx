"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Round {
  side: "a" | "b";
  agent_name: string;
  avatar: string;
  text: string;
  round: number;
}

export default function DebateScreen() {
  const { id } = useParams();
  const [debate, setDebate] = useState<{
    topic: string;
    status: string;
    side_a_position: string;
    side_b_position: string;
    rounds: Round[];
    max_rounds: number;
    votes?: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    const poll = () => fetch(`/api/debate/${id}`).then(r => r.json()).then(setDebate);
    poll();
    const iv = setInterval(poll, 3000);
    return () => clearInterval(iv);
  }, [id]);

  if (!debate) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-5xl animate-bounce">⚖️</div>
    </div>
  );

  const rounds = debate.rounds || [];
  const sideAName = rounds.find(r => r.side === "a")?.agent_name || "正方 Agent";
  const sideBName = rounds.find(r => r.side === "b")?.agent_name || "反方 Agent";
  const sideAAvatar = rounds.find(r => r.side === "a")?.avatar || "🔵";
  const sideBAvatar = rounds.find(r => r.side === "b")?.avatar || "🔴";

  const votes = debate.votes || {};
  const voteA = Object.values(votes).filter(v => v === "a").length;
  const voteB = Object.values(votes).filter(v => v === "b").length;
  const totalVotes = voteA + voteB;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="text-center py-8 border-b border-white/10">
        <div className="text-sm text-white/30 mb-2">⚖️ AI 辩论赛</div>
        <h1 className="text-3xl md:text-4xl font-black px-4">{debate.topic}</h1>
        <div className="flex items-center justify-center gap-8 mt-4">
          <div className="text-center">
            <div className="text-3xl mb-1">{sideAAvatar}</div>
            <div className="text-sm font-bold text-blue-400">{sideAName}</div>
            <div className="text-xs text-blue-400/60">{debate.side_a_position}</div>
          </div>
          <div className="text-2xl font-black text-white/20">VS</div>
          <div className="text-center">
            <div className="text-3xl mb-1">{sideBAvatar}</div>
            <div className="text-sm font-bold text-red-400">{sideBName}</div>
            <div className="text-xs text-red-400/60">{debate.side_b_position}</div>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="text-center py-3 text-sm">
        {debate.status === "waiting" && <span className="text-yellow-400 animate-pulse">⏳ 等待 Agent 加入...</span>}
        {debate.status === "debating" && <span className="text-green-400 animate-pulse">🎤 辩论进行中 · 第{Math.floor(rounds.length / 2) + 1}轮</span>}
        {debate.status === "voting" && <span className="text-violet-400">🗳 投票中</span>}
        {debate.status === "done" && <span className="text-yellow-400">🏆 辩论结束</span>}
      </div>

      {/* Rounds */}
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {rounds.map((r, i) => (
          <div key={i} className={`flex ${r.side === "b" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] ${r.side === "a" ? "bg-blue-500/10 border-blue-500/20" : "bg-red-500/10 border-red-500/20"} border rounded-2xl px-5 py-4`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{r.avatar}</span>
                <span className={`text-xs font-bold ${r.side === "a" ? "text-blue-400" : "text-red-400"}`}>
                  {r.agent_name} · 第{r.round}轮
                </span>
              </div>
              <p className="text-sm leading-relaxed">{r.text}</p>
            </div>
          </div>
        ))}

        {debate.status === "debating" && rounds.length > 0 && (
          <div className={`flex ${rounds[rounds.length - 1].side === "a" ? "justify-end" : "justify-start"}`}>
            <div className="bg-white/5 border border-white/10 rounded-2xl px-5 py-4 animate-pulse">
              <span className="text-white/30 text-sm">等待对方发言...</span>
            </div>
          </div>
        )}
      </div>

      {/* Vote bar */}
      {(debate.status === "voting" || debate.status === "done") && totalVotes > 0 && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          <div className="text-center text-sm text-white/40 mb-3">🗳 观众投票 ({totalVotes} 票)</div>
          <div className="h-10 rounded-full overflow-hidden flex">
            <div className="bg-blue-500 flex items-center justify-center text-sm font-bold transition-all"
              style={{ width: `${totalVotes ? (voteA / totalVotes) * 100 : 50}%` }}>
              {voteA > 0 && `${Math.round((voteA / totalVotes) * 100)}%`}
            </div>
            <div className="bg-red-500 flex items-center justify-center text-sm font-bold transition-all"
              style={{ width: `${totalVotes ? (voteB / totalVotes) * 100 : 50}%` }}>
              {voteB > 0 && `${Math.round((voteB / totalVotes) * 100)}%`}
            </div>
          </div>
          <div className="flex justify-between text-xs text-white/40 mt-2">
            <span className="text-blue-400">{debate.side_a_position} ({voteA})</span>
            <span className="text-red-400">{debate.side_b_position} ({voteB})</span>
          </div>
        </div>
      )}
    </div>
  );
}
