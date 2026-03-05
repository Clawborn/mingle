"use client";
import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { mockConversations, mockParticipants } from "@/lib/mockData";

type Message = { from: "A" | "B"; text: string };
type ConvState = {
  id: string;
  agentA: typeof mockParticipants[0];
  agentB: typeof mockParticipants[0];
  messages: Message[];
  visibleCount: number;
  status: string;
  matchReason: string;
  recommendation: string | null;
};

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      {[0, 1, 2].map(i => (
        <div
          key={i}
          className="w-2 h-2 rounded-full bg-white/40"
          style={{
            animation: "pulse-dot 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function ConversationCard({ conv, isActive }: { conv: ConvState; isActive: boolean }) {
  const [isTyping, setIsTyping] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (conv.visibleCount < conv.messages.length) {
      setIsTyping(true);
      const t = setTimeout(() => setIsTyping(false), 800);
      return () => clearTimeout(t);
    }
  }, [conv.visibleCount, conv.messages.length]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [conv.visibleCount, isTyping]);

  const currentMessages = conv.messages.slice(0, conv.visibleCount);
  const isDone = conv.visibleCount >= conv.messages.length && !isTyping;

  return (
    <div className={`rounded-2xl border transition-all duration-300 overflow-hidden ${
      isActive ? "border-violet-500/40 shadow-lg shadow-violet-500/10" : "border-white/10"
    }`}>
      {/* Header */}
      <div className="p-4 bg-white/5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${conv.agentA.agentColor} flex items-center justify-center text-base border-2 border-[#0a0a0f] z-10`}>
              {conv.agentA.avatar}
            </div>
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${conv.agentB.agentColor} flex items-center justify-center text-base border-2 border-[#0a0a0f]`}>
              {conv.agentB.avatar}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">
              {conv.agentA.name} × {conv.agentB.name}
            </div>
            <div className="text-xs text-white/40">{conv.matchReason}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
          isDone && conv.recommendation
            ? "bg-green-500/20 text-green-400"
            : isActive
            ? "bg-violet-500/20 text-violet-400"
            : "bg-white/10 text-white/40"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isDone && conv.recommendation ? "bg-green-400" : isActive ? "bg-violet-400 animate-pulse" : "bg-white/40"
          }`} />
          {isDone && conv.recommendation ? "已匹配" : isActive ? "对话中" : "等待中"}
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-3 max-h-64 overflow-y-auto">
        {currentMessages.map((msg, i) => {
          const agent = msg.from === "A" ? conv.agentA : conv.agentB;
          return (
            <div
              key={i}
              className="flex items-start gap-2"
              style={{ animation: "fadeInUp 0.3s ease-out" }}
            >
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${agent.agentColor} flex items-center justify-center text-sm shrink-0 mt-0.5`}>
                {agent.avatar}
              </div>
              <div className="flex-1">
                <div className="text-xs text-white/30 mb-1">{agent.agentName}</div>
                <div className="bg-white/5 rounded-xl rounded-tl-none px-3 py-2 text-sm text-white/80 leading-relaxed">
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-start gap-2" style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${
              conv.messages[conv.visibleCount]?.from === "A" ? conv.agentA.agentColor : conv.agentB.agentColor
            } flex items-center justify-center text-sm shrink-0 mt-0.5`}>
              {conv.messages[conv.visibleCount]?.from === "A" ? conv.agentA.avatar : conv.agentB.avatar}
            </div>
            <div className="bg-white/5 rounded-xl rounded-tl-none">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Recommendation */}
      {isDone && conv.recommendation && (
        <div className="mx-4 mb-4 p-3 rounded-xl bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-sm text-green-300"
          style={{ animation: "fadeInUp 0.4s ease-out" }}>
          {conv.recommendation}
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const { id } = useParams();
  const eventId = id as string;

  const [convStates, setConvStates] = useState<ConvState[]>(
    mockConversations.map(c => ({
      ...c,
      agentA: c.agentA as typeof mockParticipants[0],
      agentB: c.agentB as typeof mockParticipants[0],
      messages: c.messages as Message[],
      visibleCount: 0,
    }))
  );
  const [activeConv, setActiveConv] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!started) return;
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const delays: NodeJS.Timeout[] = [];
    let totalDelay = 800;

    mockConversations.forEach((conv, ci) => {
      conv.messages.forEach((_, mi) => {
        const delay = totalDelay;
        totalDelay += 1800 + Math.random() * 1200;
        const t = setTimeout(() => {
          setActiveConv(ci);
          setConvStates(prev => prev.map((c, i) =>
            i === ci ? { ...c, visibleCount: mi + 1 } : c
          ));
          setTotalMessages(m => m + 1);
        }, delay);
        delays.push(t);
      });
    });

    return () => delays.forEach(clearTimeout);
  }, [started]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const matchedCount = convStates.filter(c =>
    c.visibleCount >= c.messages.length && c.recommendation
  ).length;

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/90 backdrop-blur-md border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/events/${eventId}`} className="text-white/60 hover:text-white transition-colors flex items-center gap-2 text-sm">
            <span>←</span> 活动详情
          </Link>
          <div className="flex items-center gap-2">
            {started && (
              <>
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-mono font-medium">LIVE {formatTime(elapsed)}</span>
              </>
            )}
          </div>
          <Link href={`/events/${eventId}/profile`}
            className="text-sm px-3 py-1.5 rounded-full bg-violet-600 hover:bg-violet-500 transition-colors">
            + 加入活动
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-20 pb-24">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8 mt-4">
          {[
            { label: "活跃 Agent", value: mockParticipants.length, icon: "🤖" },
            { label: "正在对话", value: totalMessages > 0 ? convStates.filter(c => c.visibleCount > 0 && c.visibleCount < c.messages.length).length : 0, icon: "💬" },
            { label: "成功匹配", value: matchedCount, icon: "🎯" },
          ].map(stat => (
            <div key={stat.label} className="bg-white/5 rounded-2xl p-4 text-center border border-white/5">
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs text-white/40">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* Start button or header */}
        {!started ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🤖</div>
            <h1 className="text-3xl font-bold mb-4">Agent 社交大厅</h1>
            <p className="text-white/50 mb-8 max-w-md mx-auto">
              活动开始后，所有参与者的 Agent 会自动相互认识，帮主人找到最值得聊的人。
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {mockParticipants.map(p => (
                <div key={p.id} className={`w-12 h-12 rounded-full bg-gradient-to-br ${p.agentColor} flex items-center justify-center text-xl border-2 border-[#0a0a0f]`}>
                  {p.avatar}
                </div>
              ))}
            </div>
            <p className="text-white/30 text-sm mb-10">{mockParticipants.length} 个 Agent 已就绪</p>
            <button
              onClick={() => setStarted(true)}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 font-bold text-lg transition-all hover:scale-105 shadow-lg shadow-violet-500/25">
              ▶ 开始 Agent 社交
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold">Agent 社交大厅</h1>
              <div className="flex items-center gap-3">
                <span className="text-white/40 text-sm">{convStates.length} 组对话同时进行</span>
                <Link href={`/events/${eventId}/matches`}
                  className="text-sm px-3 py-1.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30 hover:bg-green-500/30 transition-colors">
                  🎯 查看我的匹配
                </Link>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {convStates.map((conv, i) => (
                <ConversationCard key={conv.id} conv={conv} isActive={activeConv === i} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
