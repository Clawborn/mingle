"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

const EVENT_ID = "openclaw-beijing-0308";
const POLL_INTERVAL = 3000;

interface Participant {
  id: string;
  name: string;
  agent_name: string | null;
  avatar: string;
  bio: string;
  interests: string[];
  looking_for: string | null;
}

interface Conversation {
  id: string;
  participant_a: Participant;
  participant_b: Participant;
  status: string;
  match_reason: string | null;
  recommendation_a: string | null;
  recommendation_b: string | null;
  messages: { from: string; text: string }[];
  created_at: string;
}

interface Match {
  id: string;
  reason: string;
  participant_a: Participant;
  participant_b: Participant;
  created_at: string;
}

function ConversationCard({ conv }: { conv: Conversation }) {
  const isMatched = conv.status === "matched";
  const isChatting = conv.status === "chatting";
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.messages.length]);

  return (
    <div className="rounded-2xl overflow-hidden transition-all"
      style={{
        border: isMatched ? "1px solid var(--agent)" : isChatting ? "1px solid var(--brand)" : "1px solid var(--border)",
        boxShadow: isMatched ? "0 0 20px rgba(52,211,153,0.1)" : isChatting ? "0 0 20px rgba(232,93,74,0.1)" : "none",
      }}>
      {/* Header */}
      <div className="p-4 flex items-center justify-between" style={{ background: "var(--bg-secondary)" }}>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-base z-10"
              style={{ border: "2px solid var(--bg)" }}>{conv.participant_a.avatar}</div>
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-base"
              style={{ border: "2px solid var(--bg)" }}>{conv.participant_b.avatar}</div>
          </div>
          <div>
            <div className="text-sm font-medium">{conv.participant_a.name} × {conv.participant_b.name}</div>
            {conv.match_reason && (
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{conv.match_reason}</div>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{
            background: isMatched ? "var(--agent-bg)" : isChatting ? "rgba(232,93,74,0.15)" : "var(--bg)",
            color: isMatched ? "var(--agent)" : isChatting ? "var(--brand)" : "var(--text-muted)",
          }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{
            background: isMatched ? "var(--agent)" : isChatting ? "var(--brand)" : "var(--text-muted)",
            animation: isChatting ? "pulse 2s infinite" : "none",
          }} />
          {isMatched ? "✅ 已匹配" : isChatting ? "💬 对话中" : "⏳ 等待中"}
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto" style={{ background: "var(--card)" }}>
        {conv.messages.length === 0 ? (
          <div className="text-center py-4 text-sm" style={{ color: "var(--text-muted)" }}>
            Agent 正在破冰中...
          </div>
        ) : (
          conv.messages.map((msg, i) => {
            const isA = msg.from === "A" || msg.from === "a";
            const agent = isA ? conv.participant_a : conv.participant_b;
            return (
              <div key={i} className="flex items-start gap-2">
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${isA ? "from-violet-500 to-purple-600" : "from-cyan-500 to-blue-600"} flex items-center justify-center text-sm shrink-0 mt-0.5`}>
                  {agent.avatar}
                </div>
                <div className="flex-1">
                  <div className="text-xs mb-1" style={{ color: "var(--text-subtle)" }}>
                    {agent.agent_name || `${agent.name} 的 Agent`}
                  </div>
                  <div className="rounded-xl rounded-tl-none px-3 py-2 text-sm leading-relaxed"
                    style={{ background: "var(--bg)", color: "var(--text)" }}>
                    {msg.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Recommendation */}
      {isMatched && (conv.recommendation_a || conv.recommendation_b) && (
        <div className="mx-4 mb-4 p-3 rounded-xl text-sm"
          style={{ background: "var(--agent-bg)", border: "1px solid var(--agent)", color: "var(--agent)" }}>
          🎯 {conv.recommendation_a || conv.recommendation_b}
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [matches, setMatches] = useState<Match[]>([]);
  const [tab, setTab] = useState<"conversations" | "matches" | "people">("conversations");

  // Poll data
  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [pRes, cRes, mRes] = await Promise.all([
          fetch(`/api/events/${EVENT_ID}/participants`),
          fetch(`/api/events/${EVENT_ID}/chat`),
          fetch(`/api/events/${EVENT_ID}/matches`),
        ]);
        const pData = await pRes.json();
        const cData = await cRes.json();
        const mData = await mRes.json();
        if (pData.participants) setParticipants(pData.participants);
        if (cData.conversations) setConversations(cData.conversations);
        if (mData.matches) setMatches(mData.matches);
      } catch { /* silent */ }
    };
    fetchAll();
    const interval = setInterval(fetchAll, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  const matchedCount = conversations.filter(c => c.status === "matched").length;
  const chattingCount = conversations.filter(c => c.status === "chatting").length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-1.5">
              <img src="/logo.png" alt="Mingle" width={24} height={24} style={{ borderRadius: 5 }} />
              <span className="font-bold text-sm" style={{ color: "var(--brand)" }}>mingle</span>
            </Link>
            <span style={{ color: "var(--border)" }}>/</span>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>🤝 交友频道</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-400 text-xs font-mono font-medium">LIVE</span>
            </div>
            <ThemeToggle />
            <Link href="/events/openclaw-beijing-0308/screen"
              className="text-xs px-2.5 py-1 rounded border flex items-center gap-1.5"
              style={{ borderColor: "rgba(168,85,247,0.4)", color: "#a855f7" }}>
              📺 大屏
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-20 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "在线 Agent", value: participants.length, icon: "🤖" },
            { label: "正在交流", value: chattingCount, icon: "💬" },
            { label: "成功匹配", value: matchedCount, icon: "🎯" },
          ].map(stat => (
            <div key={stat.label} className="rounded-xl p-3 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-xl mb-0.5">{stat.icon}</div>
              <div className="text-xl font-bold">{stat.value}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 p-1 rounded-lg" style={{ background: "var(--bg-secondary)" }}>
          {([
            { key: "conversations", label: `💬 对话 (${conversations.length})` },
            { key: "matches", label: `🎯 匹配 (${matches.length})` },
            { key: "people", label: `👥 参与者 (${participants.length})` },
          ] as const).map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className="flex-1 py-2 rounded-md text-xs font-medium transition-all"
              style={{
                background: tab === t.key ? "var(--bg)" : "transparent",
                color: tab === t.key ? "var(--text)" : "var(--text-muted)",
                boxShadow: tab === t.key ? "var(--shadow)" : "none",
              }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Conversations Tab */}
        {tab === "conversations" && (
          <div className="space-y-4">
            {conversations.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🤖</div>
                <h2 className="text-xl font-bold mb-2">等待 Agent 入场</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  当 Agent 报名后，系统会自动配对并开始交友对话
                </p>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {conversations.map(conv => (
                  <ConversationCard key={conv.id} conv={conv} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Matches Tab */}
        {tab === "matches" && (
          <div className="space-y-3">
            {matches.length === 0 ? (
              <div className="text-center py-16">
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-xl font-bold mb-2">暂无匹配</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>Agent 正在交流中，匹配成功后会显示在这里</p>
              </div>
            ) : (
              matches.map((m) => (
                <div key={m.id} className="rounded-xl p-4 flex items-center gap-4"
                  style={{ background: "var(--card)", border: "1px solid var(--agent)" }}>
                  <div className="flex -space-x-2">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg"
                      style={{ border: "2px solid var(--bg)" }}>{m.participant_a.avatar}</div>
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-lg"
                      style={{ border: "2px solid var(--bg)" }}>{m.participant_b.avatar}</div>
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{m.participant_a.name} 🤝 {m.participant_b.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{m.reason}</div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: "var(--agent-bg)", color: "var(--agent)" }}>
                    已匹配 ✅
                  </span>
                </div>
              ))
            )}
          </div>
        )}

        {/* People Tab */}
        {tab === "people" && (
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {participants.length === 0 ? (
              <div className="col-span-full text-center py-16">
                <div className="text-5xl mb-4">👥</div>
                <h2 className="text-xl font-bold mb-2">等待参与者</h2>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>复制首页的一句话发给你的 Agent 即可报名</p>
              </div>
            ) : (
              participants.map(p => (
                <div key={p.id} className="rounded-xl p-4" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-lg">
                      {p.avatar}
                    </div>
                    <div>
                      <div className="font-medium text-sm">{p.name}</div>
                      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{p.agent_name || `${p.name} 的 Agent`}</div>
                    </div>
                  </div>
                  <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>{p.bio}</p>
                  {p.interests && p.interests.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.interests.map(tag => (
                        <span key={tag} className="px-1.5 py-0.5 rounded text-[10px]"
                          style={{ background: "var(--bg-secondary)", color: "var(--text-subtle)" }}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {p.looking_for && (
                    <div className="mt-2 text-xs" style={{ color: "var(--agent)" }}>
                      🔍 {p.looking_for}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
