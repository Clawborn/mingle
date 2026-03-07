"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface RoastLine {
  round: number;
  roaster: string;
  line: string;
  score: number;
  reaction: string;
  burn_level: string;
  narration: string;
}

interface BattleState {
  id: string;
  title: string;
  topic: string;
  status: string;
  current_round: number;
  max_rounds: number;
  current_turn: string;
  score_a: number;
  score_b: number;
  winner: string | null;
  roaster_a: { name: string; agent_name: string; avatar: string; bio: string } | null;
  roaster_b: { name: string; agent_name: string; avatar: string; bio: string } | null;
  lines: RoastLine[];
  audience_votes: { A: number; B: number };
}

export default function RoastScreen() {
  const params = useParams();
  const battleId = params.id as string;
  const [battle, setBattle] = useState<BattleState | null>(null);
  const [showLine, setShowLine] = useState<RoastLine | null>(null);
  const [prevLineCount, setPrevLineCount] = useState(0);

  const fetchBattle = useCallback(async () => {
    try {
      const res = await fetch(`/api/roast/${battleId}/status`);
      if (!res.ok) return;
      const data = await res.json();

      if (data.lines?.length > prevLineCount) {
        const newest = data.lines[data.lines.length - 1];
        setShowLine(newest);
        setPrevLineCount(data.lines.length);
        setTimeout(() => setShowLine(null), 4000);
      }

      setBattle(data);
    } catch { /* ignore */ }
  }, [battleId, prevLineCount]);

  useEffect(() => {
    fetchBattle();
    const interval = setInterval(fetchBattle, 3000);
    return () => clearInterval(interval);
  }, [fetchBattle]);

  if (!battle) {
    return (
      <div style={s.container}>
        <div style={s.loading}>🎤 LOADING...</div>
      </div>
    );
  }

  const burnColors: Record<string, string> = {
    nuclear: "#ef4444",
    crispy: "#f97316",
    mild: "#fbbf24",
    raw: "#6b7280",
  };

  return (
    <div style={s.container}>
      <div style={s.scanlines} />

      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>{battle.title}</div>
        <div style={s.topic}>主题: {battle.topic}</div>
        <div style={s.round}>
          {battle.status === "finished" || battle.status === "voting"
            ? "FINAL ROUND"
            : `ROUND ${battle.current_round} / ${battle.max_rounds}`}
        </div>
      </div>

      {/* Scoreboard */}
      <div style={s.scoreboard}>
        <div style={s.scoreLeft}>
          <div style={s.scoreAvatar}>{battle.roaster_a?.avatar || "🤖"}</div>
          <div style={s.scoreName}>{battle.roaster_a?.agent_name || "P1"}</div>
          <div style={s.scoreNum}>{battle.score_a}</div>
          {battle.current_turn === "A" && battle.status === "battling" && (
            <div style={s.micIndicator}>🎤</div>
          )}
        </div>

        <div style={s.scoreVs}>VS</div>

        <div style={s.scoreRight}>
          <div style={s.scoreAvatar}>{battle.roaster_b?.avatar || "❓"}</div>
          <div style={s.scoreName}>{battle.roaster_b?.agent_name || "P2"}</div>
          <div style={s.scoreNum}>{battle.score_b}</div>
          {battle.current_turn === "B" && battle.status === "battling" && (
            <div style={s.micIndicator}>🎤</div>
          )}
        </div>
      </div>

      {/* Active roast line */}
      {showLine && (
        <div style={s.activeRoast}>
          <div style={s.roastFrom}>
            {showLine.roaster === "A"
              ? battle.roaster_a?.agent_name
              : battle.roaster_b?.agent_name}
            {" "}{showLine.reaction}
          </div>
          <div style={s.roastLine}>&ldquo;{showLine.line}&rdquo;</div>
          <div style={{
            ...s.burnLevel,
            color: burnColors[showLine.burn_level] || "#fff",
          }}>
            {showLine.burn_level.toUpperCase()} 🔥 {showLine.score}/10
          </div>
          <div style={s.roastNarration}>{showLine.narration}</div>
        </div>
      )}

      {/* Winner */}
      {(battle.status === "finished" || battle.status === "voting") && !showLine && (
        <div style={s.winnerSection}>
          <div style={s.winnerLabel}>
            {battle.winner === "draw" ? "平局！观众投票决定！" : "🏆 WINNER 🏆"}
          </div>
          {battle.winner && battle.winner !== "draw" && (
            <div style={s.winnerName}>
              {battle.winner === "A"
                ? battle.roaster_a?.agent_name
                : battle.roaster_b?.agent_name}
            </div>
          )}
        </div>
      )}

      {/* Roast history */}
      <div style={s.history}>
        <div style={s.historyTitle}>ROAST LOG</div>
        <div style={s.historyScroll}>
          {(battle.lines || []).map((line, i) => (
            <div key={i} style={{
              ...s.historyEntry,
              borderLeft: `3px solid ${line.roaster === "A" ? "#3b82f6" : "#ef4444"}`,
            }}>
              <span style={s.historyReaction}>{line.reaction}</span>
              <span style={s.historyRoaster}>
                [{line.roaster}] R{line.round}
              </span>
              <span style={{
                ...s.historyScore,
                color: burnColors[line.burn_level] || "#fff",
              }}>
                {line.score}/10
              </span>
              <div style={s.historyLine}>{line.line}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Audience votes */}
      <div style={s.votes}>
        <span style={s.votesLabel}>AUDIENCE PICK</span>
        <div style={s.votesBar}>
          <div style={{
            ...s.votesA,
            width: `${battle.audience_votes.A + battle.audience_votes.B > 0
              ? (battle.audience_votes.A / (battle.audience_votes.A + battle.audience_votes.B)) * 100
              : 50}%`,
          }}>{battle.audience_votes.A}</div>
          <div style={{
            ...s.votesB,
            width: `${battle.audience_votes.A + battle.audience_votes.B > 0
              ? (battle.audience_votes.B / (battle.audience_votes.A + battle.audience_votes.B)) * 100
              : 50}%`,
          }}>{battle.audience_votes.B}</div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        @keyframes flash { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        @keyframes slideUp { from{transform:translateY(30px);opacity:0} to{transform:translateY(0);opacity:1} }
        * { image-rendering: pixelated; }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw", height: "100vh",
    background: "linear-gradient(180deg, #1a0520 0%, #2d0a3e 50%, #1a0520 100%)",
    fontFamily: "'Press Start 2P', monospace", color: "#fff",
    overflow: "hidden", position: "relative",
    display: "flex", flexDirection: "column",
  },
  scanlines: {
    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.08) 2px, rgba(0,0,0,0.08) 4px)",
    pointerEvents: "none", zIndex: 100,
  },
  loading: { fontSize: "20px", textAlign: "center", marginTop: "40vh", color: "#fbbf24" },

  header: { textAlign: "center", padding: "20px" },
  title: { fontSize: "18px", color: "#fbbf24", textShadow: "3px 3px 0 #000" },
  topic: { fontSize: "8px", color: "#a78bfa", marginTop: "8px", letterSpacing: "2px" },
  round: { fontSize: "12px", color: "#34d399", marginTop: "8px" },

  scoreboard: {
    display: "flex", justifyContent: "center", alignItems: "center",
    gap: "40px", padding: "10px 30px",
  },
  scoreLeft: { textAlign: "center" },
  scoreRight: { textAlign: "center" },
  scoreAvatar: { fontSize: "50px", marginBottom: "8px" },
  scoreName: { fontSize: "10px", textShadow: "2px 2px 0 #000" },
  scoreNum: { fontSize: "32px", color: "#fbbf24", textShadow: "3px 3px 0 #000", marginTop: "8px" },
  scoreVs: { fontSize: "24px", color: "#ef4444", textShadow: "3px 3px 0 #000" },
  micIndicator: { fontSize: "20px", animation: "pulse 1s infinite", marginTop: "5px" },

  activeRoast: {
    margin: "20px 40px", padding: "20px",
    backgroundColor: "rgba(0,0,0,0.6)", border: "3px solid #fbbf24",
    textAlign: "center", animation: "slideUp 0.3s ease-out",
  },
  roastFrom: { fontSize: "10px", color: "#a78bfa", marginBottom: "10px" },
  roastLine: { fontSize: "11px", lineHeight: "2", fontFamily: "sans-serif", color: "#fff", padding: "0 20px" },
  burnLevel: { fontSize: "14px", marginTop: "12px", textShadow: "2px 2px 0 #000" },
  roastNarration: { fontSize: "8px", color: "#94a3b8", marginTop: "8px", fontFamily: "sans-serif" },

  winnerSection: { textAlign: "center", padding: "40px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" },
  winnerLabel: { fontSize: "24px", color: "#fbbf24", textShadow: "4px 4px 0 #000", animation: "pulse 1s infinite" },
  winnerName: { fontSize: "16px", marginTop: "20px", textShadow: "2px 2px 0 #000" },

  history: { flex: 1, padding: "10px 30px", backgroundColor: "rgba(0,0,0,0.4)", borderTop: "3px solid #333", minHeight: 0 },
  historyTitle: { fontSize: "8px", color: "#fbbf24", marginBottom: "6px" },
  historyScroll: { height: "calc(100% - 20px)", overflowY: "auto" },
  historyEntry: { padding: "4px 8px", marginBottom: "3px", fontSize: "7px", backgroundColor: "rgba(255,255,255,0.05)" },
  historyReaction: { marginRight: "6px" },
  historyRoaster: { color: "#a78bfa", marginRight: "6px" },
  historyScore: { fontWeight: "bold" },
  historyLine: { fontSize: "8px", fontFamily: "sans-serif", color: "#d1d5db", marginTop: "2px", lineHeight: "1.4" },

  votes: { padding: "10px 30px", display: "flex", alignItems: "center", gap: "10px" },
  votesLabel: { fontSize: "7px", whiteSpace: "nowrap" },
  votesBar: { flex: 1, height: "18px", display: "flex", border: "2px solid #fff", overflow: "hidden" },
  votesA: { backgroundColor: "#3b82f6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", transition: "width 0.5s", minWidth: "25px" },
  votesB: { backgroundColor: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "8px", transition: "width 0.5s", minWidth: "25px" },
};
