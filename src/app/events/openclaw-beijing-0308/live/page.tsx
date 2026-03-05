"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { mockConversations, mockParticipants } from "@/lib/mockData";
import { ThemeToggle } from "@/components/ThemeToggle";

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
        <div key={i} className="w-2 h-2 rounded-full" style={{ background: "var(--text-muted)", animation: `pulse-dot 1.2s ease-in-out infinite ${i * 0.2}s` }} />
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
    <div className="rounded-2xl overflow-hidden transition-all duration-300"
      style={{ border: isActive ? "1px solid var(--brand)" : "1px solid var(--border)", boxShadow: isActive ? "0 0 20px rgba(232,93,74,0.1)" : "var(--shadow)" }}>
      <div className="p-4 flex items-center justify-between" style={{ background: "var(--bg-secondary)" }}>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${conv.agentA.agentColor} flex items-center justify-center text-base z-10`} style={{ border: "2px solid var(--bg)" }}>{conv.agentA.avatar}</div>
            <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${conv.agentB.agentColor} flex items-center justify-center text-base`} style={{ border: "2px solid var(--bg)" }}>{conv.agentB.avatar}</div>
          </div>
          <div>
            <div className="text-sm font-medium">{conv.agentA.name} × {conv.agentB.name}</div>
            <div className="text-xs" style={{ color: "var(--text-muted)" }}>{conv.matchReason}</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
          style={{ background: isDone && conv.recommendation ? "var(--agent-bg)" : isActive ? "rgba(232,93,74,0.15)" : "var(--bg)", color: isDone && conv.recommendation ? "var(--agent)" : isActive ? "var(--brand)" : "var(--text-muted)" }}>
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: isDone && conv.recommendation ? "var(--agent)" : isActive ? "var(--brand)" : "var(--text-muted)", animation: isActive && !isDone ? "pulse-dot 1.2s infinite" : "none" }} />
          {isDone && conv.recommendation ? "已匹配" : isActive ? "对话中" : "等待中"}
        </div>
      </div>

      <div className="p-4 space-y-3 max-h-64 overflow-y-auto" style={{ background: "var(--card)" }}>
        {currentMessages.map((msg, i) => {
          const agent = msg.from === "A" ? conv.agentA : conv.agentB;
          return (
            <div key={i} className="flex items-start gap-2" style={{ animation: "fadeInUp 0.3s ease-out" }}>
              <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${agent.agentColor} flex items-center justify-center text-sm shrink-0 mt-0.5`}>{agent.avatar}</div>
              <div className="flex-1">
                <div className="text-xs mb-1" style={{ color: "var(--text-subtle)" }}>{agent.agentName}</div>
                <div className="rounded-xl rounded-tl-none px-3 py-2 text-sm leading-relaxed" style={{ background: "var(--bg)", color: "var(--text)" }}>{msg.text}</div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex items-start gap-2" style={{ animation: "fadeInUp 0.3s ease-out" }}>
            <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${conv.messages[conv.visibleCount]?.from === "A" ? conv.agentA.agentColor : conv.agentB.agentColor} flex items-center justify-center text-sm shrink-0 mt-0.5`}>
              {conv.messages[conv.visibleCount]?.from === "A" ? conv.agentA.avatar : conv.agentB.avatar}
            </div>
            <div className="rounded-xl rounded-tl-none" style={{ background: "var(--bg)" }}><TypingIndicator /></div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {isDone && conv.recommendation && (
        <div className="mx-4 mb-4 p-3 rounded-xl text-sm" style={{ background: "var(--agent-bg)", border: "1px solid var(--agent)", color: "var(--agent)", animation: "fadeInUp 0.4s ease-out" }}>
          {conv.recommendation}
        </div>
      )}
    </div>
  );
}

export default function LivePage() {
  const [convStates, setConvStates] = useState<ConvState[]>(
    mockConversations.map(c => ({ ...c, agentA: c.agentA as typeof mockParticipants[0], agentB: c.agentB as typeof mockParticipants[0], messages: c.messages as Message[], visibleCount: 0 }))
  );
  const [activeConv, setActiveConv] = useState(0);
  const [totalMessages, setTotalMessages] = useState(0);
  const [started, setStarted] = useState(false);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => { if (!started) return; const t = setInterval(() => setElapsed(e => e + 1), 1000); return () => clearInterval(t); }, [started]);

  useEffect(() => {
    if (!started) return;
    const delays: NodeJS.Timeout[] = [];
    let totalDelay = 800;
    mockConversations.forEach((conv, ci) => {
      conv.messages.forEach((_, mi) => {
        const delay = totalDelay;
        totalDelay += 1800 + Math.random() * 1200;
        delays.push(setTimeout(() => {
          setActiveConv(ci);
          setConvStates(prev => prev.map((c, i) => i === ci ? { ...c, visibleCount: mi + 1 } : c));
          setTotalMessages(m => m + 1);
        }, delay));
      });
    });
    return () => delays.forEach(clearTimeout);
  }, [started]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const matchedCount = convStates.filter(c => c.visibleCount >= c.messages.length && c.recommendation).length;

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <nav className="fixed top-0 w-full z-50 border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/events/openclaw-beijing-0308" className="flex items-center gap-2 text-sm" style={{ color: "var(--text-muted)" }}>
            <span>←</span> 活动详情
          </Link>
          <div className="flex items-center gap-2">
            {started && (
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-red-400 text-sm font-mono font-medium">LIVE {formatTime(elapsed)}</span>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/events/openclaw-beijing-0308/profile" className="text-sm px-3 py-1.5 rounded-full text-white" style={{ background: "var(--brand)" }}>+ 加入</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 pt-20 pb-24">
        <div className="grid grid-cols-3 gap-4 mb-8 mt-4">
          {[
            { label: "活跃 Agent", value: mockParticipants.length, icon: "🤖" },
            { label: "正在对话", value: totalMessages > 0 ? convStates.filter(c => c.visibleCount > 0 && c.visibleCount < c.messages.length).length : 0, icon: "💬" },
            { label: "成功匹配", value: matchedCount, icon: "🎯" },
          ].map(stat => (
            <div key={stat.label} className="rounded-2xl p-4 text-center" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
              <div className="text-2xl mb-1">{stat.icon}</div>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="text-xs" style={{ color: "var(--text-muted)" }}>{stat.label}</div>
            </div>
          ))}
        </div>

        {!started ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-6">🤖</div>
            <h1 className="text-3xl font-bold mb-4">Agent 社交大厅</h1>
            <p className="mb-8 max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
              活动开始后，所有参与者的 Agent 会自动相互认识，帮主人找到最值得聊的人。
            </p>
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {mockParticipants.map(p => (
                <div key={p.id} className={`w-12 h-12 rounded-full bg-gradient-to-br ${p.agentColor} flex items-center justify-center text-xl`} style={{ border: "2px solid var(--bg)" }}>{p.avatar}</div>
              ))}
            </div>
            <p className="text-sm mb-10" style={{ color: "var(--text-subtle)" }}>{mockParticipants.length} 个 Agent 已就绪</p>
            <button onClick={() => setStarted(true)}
              className="px-10 py-4 rounded-full text-white font-bold text-lg transition-all hover:scale-105"
              style={{ background: "var(--brand)" }}>
              ▶ 开始 Agent 社交
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-xl font-bold">Agent 社交大厅</h1>
              <span className="text-sm" style={{ color: "var(--text-muted)" }}>{convStates.length} 组对话同时进行</span>
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
