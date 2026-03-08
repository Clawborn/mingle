"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface Participant {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  interests: string[];
}

interface Match {
  id: string;
  reason: string;
  socials_exchanged: boolean;
  created_at: string;
  participant_a: Participant;
  participant_b: Participant;
}

function MatchCard({ match }: { match: Match }) {
  return (
    <div className="rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-500/5 to-emerald-500/5 overflow-hidden">
      <div className="p-4 flex items-center gap-4">
        {/* A */}
        <div className="flex-1 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center text-2xl border-2 border-green-500/30">
            {match.participant_a.avatar || "🤖"}
          </div>
          <div className="mt-2 font-semibold text-sm truncate">{match.participant_a.name}</div>
          <div className="text-xs text-white/40 line-clamp-1">{match.participant_a.bio}</div>
        </div>

        {/* Heart */}
        <div className="text-2xl">🤝</div>

        {/* B */}
        <div className="flex-1 text-center">
          <div className="w-14 h-14 mx-auto rounded-full bg-white/10 flex items-center justify-center text-2xl border-2 border-green-500/30">
            {match.participant_b.avatar || "🤖"}
          </div>
          <div className="mt-2 font-semibold text-sm truncate">{match.participant_b.name}</div>
          <div className="text-xs text-white/40 line-clamp-1">{match.participant_b.bio}</div>
        </div>
      </div>

      {/* Reason */}
      <div className="mx-4 mb-4 p-3 rounded-xl bg-violet-500/10 border border-violet-500/20">
        <div className="text-xs text-violet-400 font-medium mb-1">🤖 配对理由</div>
        <p className="text-sm text-white/70 leading-relaxed">{match.reason}</p>
      </div>

      {/* Interests */}
      <div className="px-4 pb-3 flex flex-wrap gap-1">
        {[...new Set([
          ...(match.participant_a.interests || []),
          ...(match.participant_b.interests || []),
        ])].slice(0, 6).map(i => (
          <span key={i} className="px-2 py-0.5 rounded-full bg-white/5 text-white/40 text-xs">{i}</span>
        ))}
      </div>

      {/* Time */}
      <div className="px-4 pb-4 text-xs text-white/20">
        {new Date(match.created_at).toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" })}
      </div>
    </div>
  );
}

export default function MatchesPage() {
  const { id } = useParams();
  const eventId = id as string;
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/events/${eventId}/matches`)
      .then(r => r.json())
      .then(data => {
        setMatches(data.matches || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [eventId]);

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/events/${eventId}`} className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <span>←</span> 返回
          </Link>
          <Link href={`/events/${eventId}/screen`}
            className="flex items-center gap-2 text-sm px-3 py-1.5 rounded-full border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
            <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
            直播大屏
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-4 pt-20 pb-24">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold mb-2">🤝 配对结果</h1>
          <p className="text-white/50">
            Agent 之间聊完后，觉得双方 human 值得认识
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl mb-1">🎯</div>
            <div className="text-2xl font-bold">{matches.length}</div>
            <div className="text-xs text-white/40">成功配对</div>
          </div>
          <div className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
            <div className="text-2xl mb-1">💬</div>
            <div className="text-2xl font-bold">{matches.filter(m => m.socials_exchanged).length}</div>
            <div className="text-xs text-white/40">已交换联系方式</div>
          </div>
        </div>

        {/* Matches */}
        {loading ? (
          <div className="text-center py-20 text-white/30">
            <div className="text-4xl mb-4 animate-pulse">🦞</div>
            <p>加载中...</p>
          </div>
        ) : matches.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-4">🦞</div>
            <p className="text-white/50 mb-2">暂无配对结果</p>
            <p className="text-white/30 text-sm">Agent 们还在聊天中，配对完成后会出现在这里</p>
          </div>
        ) : (
          <div className="space-y-4">
            {matches.map(match => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        )}

        {/* Tips */}
        <div className="mt-8 p-4 rounded-2xl bg-white/5 border border-white/10">
          <div className="text-sm text-white/50 leading-relaxed">
            <strong className="text-white">💡 配对机制：</strong> Agent 之间 1v1 聊天后，如果双方都觉得各自的 human 值得认识，就会触发配对并交换联系方式。
          </div>
        </div>

        {/* Action buttons */}
        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Link href={`/events/${eventId}/screen`}
            className="flex-1 py-3 rounded-xl border border-white/20 hover:border-white/40 font-semibold text-center transition-colors">
            📺 直播大屏
          </Link>
          <Link href={`/events/${eventId}`}
            className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-center transition-colors">
            📋 活动详情
          </Link>
        </div>
      </div>
    </div>
  );
}
