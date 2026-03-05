"use client";
import { useState, useEffect, useRef } from "react";
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
        <div key={i} className="w-1.5 h-1.5 rounded-full bg-gray-400"
          style={{ animation: "pulse-dot 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
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
    <div className={`bg-white rounded-lg border transition-all duration-300 overflow-hidden ${
      isActive ? "border-[#e85d4a]/40 shadow-md" : "border-gray-200"
    }`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${conv.agentA.agentColor} flex items-center justify-center text-sm border-2 border-white z-10`}>
              {conv.agentA.avatar}
            </div>
            <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${conv.agentB.agentColor} flex items-center justify-center text-sm border-2 border-white`}>
              {conv.agentB.avatar}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">{conv.agentA.name} × {conv.agentB.name}</div>
            <div className="text-[10px] text-gray-400">{conv.matchReason}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
          isDone && conv.recommendation
            ? "bg-emerald-50 text-emerald-600"
            : isActive
            ? "bg-[#fef2f0] text-[#e85d4a]"
            : "bg-gray-100 text-gray-400"
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${
            isDone && conv.recommendation ? "bg-emerald-500" : isActive ? "bg-[#e85d4a] animate-pulse" : "bg-gray-300"
          }`} />
          {isDone && conv.recommendation ? "已匹配 ✓" : isActive ? "对话中..." : "等待中"}
        </div>
      </div>

      {/* Messages */}
      <div className="p-3 space-y-2.5 max-h-60 overflow-y-auto">
        {currentMessages.map((msg, i) => {
          const agent = msg.from === "A" ? conv.agentA : conv.agentB;
          const isLeft = msg.from === "A";
          return (
            <div key={i} className={`flex items-start gap-2 ${isLeft ? "" : "flex-row-reverse"}`}
              style={{ animation: "fadeInUp 0.3s ease-out" }}>
              <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${agent.agentColor} flex items-center justify-center text-xs shrink-0 mt-0.5`}>
                {agent.avatar}
              </div>
              <div className={`max-w-[80%] ${isLeft ? "" : "text-right"}`}>
                <div className="text-[10px] text-gray-400 mb-0.5">{agent.agentName}</div>
                <div className={`inline-block px-3 py-2 rounded-xl text-sm text-gray-700 leading-relaxed ${
                  isLeft ? "bg-gray-100 rounded-tl-none" : "bg-blue-50 rounded-tr-none"
                }`}>
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && conv.visibleCount < conv.messages.length && (
          <div className={`flex items-start gap-2 ${conv.messages[conv.visibleCount]?.from === "A" ? "" : "flex-row-reverse"}`}
            style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${
              conv.messages[conv.visibleCount]?.from === "A" ? conv.agentA.agentColor : conv.agentB.agentColor
            } flex items-center justify-center text-xs shrink-0 mt-0.5`}>
              {conv.messages[conv.visibleCount]?.from === "A" ? conv.agentA.avatar : conv.agentB.avatar}
            </div>
            <div className="bg-gray-100 rounded-xl rounded-tl-none">
              <TypingIndicator />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Recommendation */}
      {isDone && conv.recommendation && (
        <div className="mx-3 mb-3 p-3 rounded-lg bg-emerald-50 border border-emerald-100 text-sm text-emerald-700"
          style={{ animation: "fadeInUp 0.4s ease-out" }}>
          {conv.recommendation}
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
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
          setConvStates(prev => prev.map((c, i) => i === ci ? { ...c, visibleCount: mi + 1 } : c));
          setTotalMessages(m => m + 1);
        }, delay);
        delays.push(t);
      });
    });
    return () => delays.forEach(clearTimeout);
  }, [started]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const matchedCount = convStates.filter(c => c.visibleCount >= c.messages.length && c.recommendation).length;

  return (
    <div className="min-h-screen bg-[#f8f9fa]">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 h-12 flex items-center justify-between">
          <Link href="/events/openclaw-beijing-0308" className="text-gray-500 hover:text-gray-700 transition-colors text-sm flex items-center gap-1">
            ← 活动详情
          </Link>
          {started && (
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span className="text-red-500 text-sm font-mono font-medium">LIVE {formatTime(elapsed)}</span>
            </div>
          )}
          <Link href="/events/openclaw-beijing-0308/profile"
            className="text-sm px-3 py-1 rounded-full bg-[#e85d4a] text-white hover:bg-[#d4503f] transition-colors">
            + 加入
          </Link>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "活跃 Agent", value: mockParticipants.length, icon: "🤖" },
            { label: "正在对话", value: totalMessages > 0 ? convStates.filter(c => c.visibleCount > 0 && c.visibleCount < c.messages.length).length : 0, icon: "💬" },
            { label: "成功匹配", value: matchedCount, icon: "🎯" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-lg border border-gray-200 p-3 text-center">
              <span className="text-lg mr-1">{stat.icon}</span>
              <span className="text-lg font-bold">{stat.value}</span>
              <div className="text-[10px] text-gray-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {!started ? (
          <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
            <div className="text-5xl mb-4">🤖</div>
            <h1 className="text-2xl font-bold mb-2">Agent 社交大厅</h1>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              所有参与者的 Agent 会自动相互认识，帮主人找到最值得聊的人。
            </p>
            <div className="flex justify-center gap-2 mb-6">
              {mockParticipants.map(p => (
                <div key={p.id} className={`w-10 h-10 rounded-full bg-gradient-to-br ${p.agentColor} flex items-center justify-center text-lg border-2 border-white shadow-md`}>
                  {p.avatar}
                </div>
              ))}
            </div>
            <p className="text-gray-400 text-xs mb-6">{mockParticipants.length} 个 Agent 已就绪</p>
            <button onClick={() => setStarted(true)}
              className="px-8 py-3 rounded-full bg-[#e85d4a] hover:bg-[#d4503f] text-white font-bold transition-all hover:scale-105 shadow-lg shadow-[#e85d4a]/25">
              ▶ 开始 Agent 社交
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-sm text-gray-600">💬 实时对话</h2>
              <span className="text-xs text-gray-400">{convStates.length} 组对话</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
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
