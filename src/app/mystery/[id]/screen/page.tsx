"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface Player {
  role_name: string;
  role_description: string;
  alibi: string;
  participant: { name: string; agent_name: string; avatar: string } | null;
  vote_target: string | null;
}

interface Message {
  id: string;
  type: string;
  from_role: string;
  from_avatar: string;
  to_role: string | null;
  content: string;
  created_at: string;
}

interface MysteryState {
  id: string;
  title: string;
  scenario: string;
  victim: string;
  murder_method: string;
  status: string;
  current_phase: string;
  players: Player[];
  messages: Message[];
  result?: {
    killer_role: string;
    killer_caught: boolean;
    votes_for_killer: number;
    total_voters: number;
  };
}

export default function MysteryScreen() {
  const params = useParams();
  const mysteryId = params.id as string;
  const [mystery, setMystery] = useState<MysteryState | null>(null);
  const [newMsg, setNewMsg] = useState<Message | null>(null);

  const fetchMystery = useCallback(async () => {
    try {
      const res = await fetch(`/api/mystery/${mysteryId}/screen`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.messages?.length > 0) {
        const latest = data.messages[data.messages.length - 1];
        if (!newMsg || latest.id !== newMsg.id) {
          setNewMsg(latest);
        }
      }

      setMystery(data);
    } catch { /* ignore */ }
  }, [mysteryId, newMsg]);

  useEffect(() => {
    fetchMystery();
    const interval = setInterval(fetchMystery, 3000);
    return () => clearInterval(interval);
  }, [fetchMystery]);

  if (!mystery) {
    return (
      <div style={s.container}>
        <div style={s.loading}>🔍 LOADING CASE FILES...</div>
      </div>
    );
  }

  const phaseLabel: Record<string, string> = {
    investigation: "🔍 调查阶段",
    debate: "⚖️ 辩论阶段",
    voting: "🗳️ 投票阶段",
  };

  return (
    <div style={s.container}>
      {/* Noir film grain */}
      <div style={s.grain} />

      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>{mystery.title}</div>
        <div style={s.phase}>
          {mystery.status === "revealed" ? "🎭 真相揭晓" : phaseLabel[mystery.current_phase] || mystery.current_phase}
        </div>
      </div>

      {/* Case info */}
      <div style={s.caseInfo}>
        <div style={s.caseLabel}>📋 案件</div>
        <div style={s.scenario}>{mystery.scenario}</div>
        <div style={s.victim}>
          <span style={s.victimLabel}>💀 受害者：</span>{mystery.victim}
          <span style={s.methodLabel}> | 🔪 手法：</span>{mystery.murder_method}
        </div>
      </div>

      {/* Suspects */}
      <div style={s.suspectsSection}>
        <div style={s.sectionTitle}>🕵️ 嫌疑人</div>
        <div style={s.suspectsGrid}>
          {(mystery.players || []).map((p, i) => (
            <div key={i} style={{
              ...s.suspectCard,
              border: mystery.result?.killer_role === p.role_name
                ? "2px solid #ef4444"
                : "1px solid rgba(255,255,255,0.1)",
            }}>
              <div style={s.suspectAvatar}>{p.participant?.avatar || "🕵️"}</div>
              <div style={s.suspectName}>{p.role_name}</div>
              <div style={s.suspectAgent}>{p.participant?.agent_name || p.participant?.name}</div>
              <div style={s.suspectAlibi}>"{p.alibi}"</div>
              {mystery.result?.killer_role === p.role_name && (
                <div style={s.killerBadge}>🔪 凶手</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Chat log */}
      <div style={s.chatSection}>
        <div style={s.sectionTitle}>💬 对话记录</div>
        <div style={s.chatScroll}>
          {(mystery.messages || []).slice(-15).map((msg, i) => (
            <div key={i} style={{
              ...s.chatMsg,
              borderLeft: msg.type === "accusation" ? "3px solid #ef4444"
                : msg.type === "interrogation" ? "3px solid #f59e0b"
                : msg.type === "evidence" ? "3px solid #4ade80"
                : "3px solid #6366f1",
            }}>
              <div style={s.msgHeader}>
                <span style={s.msgAvatar}>{msg.from_avatar || "🕵️"}</span>
                <span style={s.msgFrom}>{msg.from_role}</span>
                {msg.to_role && <span style={s.msgTo}>→ {msg.to_role}</span>}
                <span style={s.msgType}>{msg.type.toUpperCase()}</span>
              </div>
              <div style={s.msgContent}>{msg.content}</div>
            </div>
          ))}
          {(!mystery.messages || mystery.messages.length === 0) && (
            <div style={s.emptyLog}>等待玩家发言...</div>
          )}
        </div>
      </div>

      {/* Result overlay */}
      {mystery.status === "revealed" && mystery.result && (
        <div style={s.resultOverlay}>
          <div style={s.resultCard}>
            <div style={s.resultEmoji}>{mystery.result.killer_caught ? "🎉" : "😈"}</div>
            <div style={s.resultTitle}>
              {mystery.result.killer_caught ? "真相大白！" : "凶手逃脱！"}
            </div>
            <div style={s.resultKiller}>
              凶手是：{mystery.result.killer_role}
            </div>
            <div style={s.resultVotes}>
              {mystery.result.votes_for_killer}/{mystery.result.total_voters} 票命中
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+SC:wght@400;700&display=swap');
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw", height: "100vh",
    background: "linear-gradient(180deg, #0a0a0f 0%, #1a1020 50%, #0f0a15 100%)",
    fontFamily: "'Noto Serif SC', serif",
    color: "#e2e8f0",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
    position: "relative",
  },
  grain: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    background: "repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.05) 3px, rgba(0,0,0,0.05) 6px)",
    pointerEvents: "none", zIndex: 100,
  },
  loading: {
    fontSize: "20px", textAlign: "center", marginTop: "40vh",
    color: "#a78bfa",
  },

  header: {
    padding: "20px 30px", display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "1px solid rgba(255,255,255,0.1)",
  },
  title: {
    fontSize: "22px", fontWeight: 700, color: "#c4b5fd",
    textShadow: "0 0 20px rgba(139,92,246,0.3)",
  },
  phase: {
    fontSize: "14px", color: "#a78bfa",
    padding: "4px 12px", borderRadius: "20px",
    background: "rgba(139,92,246,0.15)",
  },

  caseInfo: {
    padding: "15px 30px",
    background: "rgba(0,0,0,0.3)",
    borderBottom: "1px solid rgba(255,255,255,0.05)",
  },
  caseLabel: { fontSize: "11px", color: "#a78bfa", marginBottom: "6px", letterSpacing: "2px" },
  scenario: { fontSize: "13px", color: "#94a3b8", lineHeight: "1.6", marginBottom: "8px" },
  victim: { fontSize: "12px", color: "#f87171" },
  victimLabel: { color: "#ef4444" },
  methodLabel: { color: "#ef4444" },

  suspectsSection: { padding: "12px 30px" },
  sectionTitle: { fontSize: "12px", color: "#a78bfa", marginBottom: "10px", letterSpacing: "2px" },
  suspectsGrid: {
    display: "flex", gap: "10px", overflowX: "auto", paddingBottom: "8px",
  },
  suspectCard: {
    minWidth: "130px", padding: "12px",
    background: "rgba(255,255,255,0.03)", borderRadius: "12px",
    textAlign: "center", position: "relative", flexShrink: 0,
  },
  suspectAvatar: { fontSize: "32px", marginBottom: "6px" },
  suspectName: { fontSize: "11px", fontWeight: 700, color: "#e2e8f0", marginBottom: "2px" },
  suspectAgent: { fontSize: "9px", color: "#64748b", marginBottom: "6px" },
  suspectAlibi: { fontSize: "9px", color: "#94a3b8", fontStyle: "italic", lineHeight: "1.4" },
  killerBadge: {
    position: "absolute", top: "6px", right: "6px",
    fontSize: "9px", background: "rgba(239,68,68,0.2)", color: "#ef4444",
    padding: "2px 6px", borderRadius: "8px",
  },

  chatSection: { flex: 1, padding: "0 30px 10px", display: "flex", flexDirection: "column", minHeight: 0 },
  chatScroll: { flex: 1, overflowY: "auto", paddingRight: "5px" },
  chatMsg: {
    padding: "8px 12px", marginBottom: "6px",
    background: "rgba(255,255,255,0.03)", borderRadius: "8px",
  },
  msgHeader: { display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" },
  msgAvatar: { fontSize: "16px" },
  msgFrom: { fontSize: "11px", fontWeight: 700, color: "#c4b5fd" },
  msgTo: { fontSize: "10px", color: "#f59e0b" },
  msgType: {
    fontSize: "8px", color: "#64748b", marginLeft: "auto",
    padding: "1px 6px", background: "rgba(255,255,255,0.05)", borderRadius: "4px",
  },
  msgContent: { fontSize: "12px", color: "#cbd5e1", lineHeight: "1.5" },
  emptyLog: { textAlign: "center", color: "#4a5568", fontSize: "13px", marginTop: "40px" },

  resultOverlay: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    background: "rgba(0,0,0,0.85)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 50,
  },
  resultCard: {
    textAlign: "center", padding: "40px",
    background: "rgba(139,92,246,0.1)", borderRadius: "24px",
    border: "1px solid rgba(139,92,246,0.3)",
  },
  resultEmoji: { fontSize: "64px", marginBottom: "16px" },
  resultTitle: { fontSize: "28px", fontWeight: 700, color: "#c4b5fd", marginBottom: "12px" },
  resultKiller: { fontSize: "18px", color: "#f87171", marginBottom: "8px" },
  resultVotes: { fontSize: "14px", color: "#94a3b8" },
};
