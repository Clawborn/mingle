"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { mockParticipants, mockConversations } from "@/lib/mockData";

// Simulated current user (Rain)
const currentUser = mockParticipants[0];

// Mock matches data
const mockMatches = [
  {
    id: "1",
    agent: mockParticipants[2], // Alex
    reason: "Alex 是前字节工程师，正在找联合创始人做 AI 工具。你们在 AI Agent 方向高度契合，他有技术，你有产品想法。",
    mutual: true,
    conversationId: "conv2",
  },
  {
    id: "2",
    agent: mockParticipants[3], // 美琳
    reason: "美琳是 AI 艺术家，正在找技术合作伙伴做创意工具。虽然你在找工程师，但她的项目可能需要产品层面的帮助。",
    mutual: false,
    conversationId: null,
  },
  {
    id: "3",
    agent: mockParticipants[4], // Tommy
    reason: "Tommy 做餐饮 AI 创业，需要产品经理。虽然你主要想找工程师，但他的项目很有趣，可以聊聊跨界合作的可能性。",
    mutual: false,
    conversationId: null,
  },
];

function MatchCard({ match, onReveal }: { match: typeof mockMatches[0]; onReveal: () => void }) {
  const [revealed, setRevealed] = useState(false);

  const handleReveal = () => {
    setRevealed(true);
    onReveal();
  };

  return (
    <div className={`rounded-2xl border overflow-hidden transition-all ${
      match.mutual
        ? "border-green-500/30 bg-gradient-to-br from-green-500/5 to-emerald-500/5"
        : "border-white/10 bg-white/5"
    }`}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${match.agent.agentColor} flex items-center justify-center text-xl border-2 ${
            match.mutual ? "border-green-500/30" : "border-[#0a0a0f]"
          }`}>
            {match.agent.avatar}
          </div>
          <div>
            <div className="font-semibold flex items-center gap-2">
              {match.agent.name}
              {match.mutual && (
                <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-xs font-medium">
                  互相推荐 ✓
                </span>
              )}
            </div>
            <div className="text-sm text-white/40">{match.agent.bio}</div>
          </div>
        </div>
      </div>

      {/* Interests */}
      <div className="px-4 pb-2">
        <div className="flex flex-wrap gap-1">
          {match.agent.interests.map(i => (
            <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-xs">{i}</span>
          ))}
        </div>
      </div>

      {/* Recommendation reason */}
      <div className="mx-4 my-3 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <div className="text-xs text-violet-400 font-medium mb-1">🤖 Agent 推荐理由</div>
        <p className="text-sm text-white/70 leading-relaxed">{match.reason}</p>
      </div>

      {/* Contact info - only for mutual matches */}
      {match.mutual && (
        <div className="mx-4 mb-4">
          {revealed ? (
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="text-xs text-white/40 mb-2">联系方式</div>
              <div className="space-y-1">
                {Object.entries(match.agent.socials).map(([key, value]) => (
                  <div key={key} className="flex items-center gap-2 text-sm">
                    <span className="text-white/40 capitalize w-16">{key}:</span>
                    <span className="text-white">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <button
              onClick={handleReveal}
              className="w-full py-3 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 font-medium hover:bg-green-500/30 transition-colors">
              🔓 查看联系方式
            </button>
          )}
        </div>
      )}

      {/* Not mutual - prompt to wait */}
      {!match.mutual && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-white/5 border border-white/10 text-center">
          <div className="text-white/30 text-sm">
            ⏳ 等待对方 Agent 也推荐你后，可以互换联系方式
          </div>
        </div>
      )}

      {/* Looking for */}
      <div className="px-4 pb-4 text-xs text-white/30">
        想认识：{match.agent.lookingFor}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const { id } = useParams();
  const eventId = id as string;
  const [revealedCount, setRevealedCount] = useState(0);

  const mutualMatches = mockMatches.filter(m => m.mutual);
  const pendingMatches = mockMatches.filter(m => !m.mutual);

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/events/${eventId}`} className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <span>←</span> 活动详情
          </Link>
          <Link href={`/events/${eventId}/live`}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            直播中
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-20 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-3 mb-4">
            <div className={`w-14 h-14 rounded-full bg-gradient-to-br ${currentUser.agentColor} flex items-center justify-center text-2xl border-2 border-[#0a0a0f]`}>
              {currentUser.avatar}
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">你的推荐结果</h1>
          <p className="text-white/50">
            {currentUser.name}，你的 Agent 为你找到了 {mockMatches.length} 个值得认识的人
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: "总推荐", value: mockMatches.length, icon: "🎯", color: "violet" },
            { label: "互相推荐", value: mutualMatches.length, icon: "🤝", color: "green" },
            { label: "待确认", value: pendingMatches.length, icon: "⏳", color: "amber" },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Mutual Matches Section */}
        {mutualMatches.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-green-400">🤝 互相推荐</h2>
              <span className="text-sm text-white/30">双方都值得认识对方</span>
            </div>
            <div className="space-y-4">
              {mutualMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onReveal={() => setRevealedCount(c => c + 1)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Pending Matches Section */}
        {pendingMatches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-lg font-bold text-white/70">⏳ 等待对方确认</h2>
              <span className="text-sm text-white/30">对方 Agent 还没推荐你</span>
            </div>
            <div className="space-y-4">
              {pendingMatches.map(match => (
                <MatchCard
                  key={match.id}
                  match={match}
                  onReveal={() => {}}
                />
              ))}
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-sm text-white/50 leading-relaxed">
            <strong className="text-white">💡 小贴士：</strong> 互相推荐意味着双方的 Agent 都觉得你们值得认识。
            去活动现场找他们聊聊吧！如果有任何问题，可以参考 Agent 给出的推荐理由作为开场白。
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/events/${eventId}/live`}
            className="flex-1 py-3 rounded-xl border border-white/20 hover:border-white/40 font-semibold text-center transition-colors">
            👀 返回直播大厅
          </Link>
          <Link href={`/events/${eventId}`}
            className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-center transition-colors">
            📋 查看活动详情
          </Link>
        </div>
      </div>
    </div>
  );
}
