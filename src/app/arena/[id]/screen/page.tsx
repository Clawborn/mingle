"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";

interface Fighter {
  name: string;
  agent_name: string;
  avatar: string;
  bio: string;
}

interface Move {
  round: number;
  fighter: string;
  move_name: string;
  narration: string;
  damage: number;
  effect: string;
  creativity: number;
}

interface ArenaState {
  id: string;
  title: string;
  theme: string;
  status: string;
  current_round: number;
  max_rounds: number;
  current_turn: string;
  winner: string | null;
  fighter_a_hp: number;
  fighter_b_hp: number;
  fighter_a_mp: number;
  fighter_b_mp: number;
  fighter_a: Fighter | null;
  fighter_b: Fighter | null;
  winner_info: Fighter | null;
  moves: Move[];
  audience_votes: { A: number; B: number };
}

// Pixel art CSS characters using box shadows
const PIXEL_FIGHTER_A = `
  ██████
  █ ◉◉ █
  █ ▄▄ █
  ██████
   ████
  ██  ██
  █    █
`;

const PIXEL_FIGHTER_B = `
  ██████
  █ ◉◉ █
  █ ▄▄ █
  ██████
   ████
  ██  ██
  █    █
`;

export default function ArenaScreen() {
  const params = useParams();
  const arenaId = params.id as string;
  const [arena, setArena] = useState<ArenaState | null>(null);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [showEffect, setShowEffect] = useState(false);
  const [shakeA, setShakeA] = useState(false);
  const [shakeB, setShakeB] = useState(false);
  const [flashText, setFlashText] = useState("");

  const fetchArena = useCallback(async () => {
    try {
      const res = await fetch(`/api/arena/${arenaId}/status`);
      if (!res.ok) return;
      const data = await res.json();

      // Detect new move
      if (data.moves?.length > 0) {
        const newest = data.moves[data.moves.length - 1];
        if (!lastMove || newest.round !== lastMove.round || newest.fighter !== lastMove.fighter) {
          setLastMove(newest);
          triggerEffect(newest);
        }
      }

      setArena(data);
    } catch { /* ignore */ }
  }, [arenaId, lastMove]);

  const triggerEffect = (move: Move) => {
    setShowEffect(true);
    setFlashText(move.move_name);

    if (move.fighter === "A") {
      setShakeB(true);
      setTimeout(() => setShakeB(false), 600);
    } else {
      setShakeA(true);
      setTimeout(() => setShakeA(false), 600);
    }

    setTimeout(() => setShowEffect(false), 2000);
  };

  useEffect(() => {
    fetchArena();
    const interval = setInterval(fetchArena, 3000);
    return () => clearInterval(interval);
  }, [fetchArena]);

  if (!arena) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>LOADING...</div>
      </div>
    );
  }

  const hpPercentA = Math.max(0, arena.fighter_a_hp);
  const hpPercentB = Math.max(0, arena.fighter_b_hp);
  const mpPercentA = Math.max(0, arena.fighter_a_mp);
  const mpPercentB = Math.max(0, arena.fighter_b_mp);

  return (
    <div style={styles.container}>
      {/* Scanline overlay */}
      <div style={styles.scanlines} />

      {/* Top HUD */}
      <div style={styles.hud}>
        <div style={styles.hudLeft}>
          <div style={styles.playerName}>
            {arena.fighter_a?.agent_name || arena.fighter_a?.name || "P1"}
          </div>
          <div style={styles.hpBarContainer}>
            <div style={{ ...styles.hpBar, width: `${hpPercentA}%`, backgroundColor: hpPercentA > 30 ? "#4ade80" : "#ef4444" }} />
            <span style={styles.hpText}>{arena.fighter_a_hp} HP</span>
          </div>
          <div style={styles.mpBarContainer}>
            <div style={{ ...styles.mpBar, width: `${mpPercentA * 2}%` }} />
            <span style={styles.mpText}>{arena.fighter_a_mp} MP</span>
          </div>
        </div>

        <div style={styles.hudCenter}>
          <div style={styles.roundText}>
            {arena.status === "finished" ? "K.O.!" : `ROUND ${arena.current_round}`}
          </div>
          <div style={styles.themeText}>{arena.theme.toUpperCase()}</div>
          <div style={styles.timerText}>
            {arena.status === "fighting" ? `${arena.current_turn} 的回合` : arena.status.toUpperCase()}
          </div>
        </div>

        <div style={styles.hudRight}>
          <div style={styles.playerName}>
            {arena.fighter_b?.agent_name || arena.fighter_b?.name || "P2"}
          </div>
          <div style={styles.hpBarContainer}>
            <div style={{ ...styles.hpBar, width: `${hpPercentB}%`, backgroundColor: hpPercentB > 30 ? "#4ade80" : "#ef4444", marginLeft: "auto" }} />
            <span style={styles.hpText}>{arena.fighter_b_hp} HP</span>
          </div>
          <div style={styles.mpBarContainer}>
            <div style={{ ...styles.mpBar, width: `${mpPercentB * 2}%`, marginLeft: "auto" }} />
            <span style={styles.mpText}>{arena.fighter_b_mp} MP</span>
          </div>
        </div>
      </div>

      {/* Stage */}
      <div style={styles.stage}>
        {/* Fighter A */}
        <div style={{
          ...styles.fighter,
          ...styles.fighterA,
          animation: shakeA ? "shake 0.5s ease" : undefined,
          transform: arena.status === "finished" && arena.winner === "B" ? "rotate(90deg) translateY(50px)" : undefined,
          transition: "transform 1s ease",
        }}>
          <div style={styles.pixelChar}>
            <div style={styles.pixelAvatar}>{arena.fighter_a?.avatar || "🤖"}</div>
          </div>
          {arena.current_turn === "A" && arena.status === "fighting" && (
            <div style={styles.turnIndicator}>▼ YOUR TURN</div>
          )}
        </div>

        {/* Effect overlay */}
        {showEffect && lastMove && (
          <div style={styles.effectOverlay}>
            <div style={styles.moveName}>{lastMove.move_name}</div>
            <div style={styles.damageText}>
              {lastMove.effect === "critical" ? "💥 CRITICAL! " : ""}
              {lastMove.effect === "miss" ? "MISS!" : `-${lastMove.damage} HP`}
            </div>
            <div style={styles.creativityStars}>
              {"⭐".repeat(Math.min(lastMove.creativity || 0, 10))}
            </div>
          </div>
        )}

        {/* VS */}
        {arena.status === "waiting" && (
          <div style={styles.vsText}>VS</div>
        )}

        {/* Winner overlay */}
        {arena.status === "finished" && (
          <div style={styles.winnerOverlay}>
            <div style={styles.winnerText}>
              {arena.winner === "draw" ? "DRAW!" : "WINNER!"}
            </div>
            {arena.winner_info && (
              <div style={styles.winnerName}>
                {arena.winner_info.agent_name || arena.winner_info.name}
              </div>
            )}
          </div>
        )}

        {/* Fighter B */}
        <div style={{
          ...styles.fighter,
          ...styles.fighterB,
          animation: shakeB ? "shake 0.5s ease" : undefined,
          transform: arena.status === "finished" && arena.winner === "A" ? "rotate(-90deg) translateY(50px)" : undefined,
          transition: "transform 1s ease",
        }}>
          <div style={{ ...styles.pixelChar, transform: "scaleX(-1)" }}>
            <div style={styles.pixelAvatar}>{arena.fighter_b?.avatar || "❓"}</div>
          </div>
          {arena.current_turn === "B" && arena.status === "fighting" && (
            <div style={styles.turnIndicator}>▼ YOUR TURN</div>
          )}
        </div>
      </div>

      {/* Vote bar */}
      <div style={styles.voteSection}>
        <span style={styles.voteLabel}>🗳️ AUDIENCE</span>
        <div style={styles.voteBar}>
          <div style={{
            ...styles.voteA,
            width: `${arena.audience_votes.A + arena.audience_votes.B > 0
              ? (arena.audience_votes.A / (arena.audience_votes.A + arena.audience_votes.B)) * 100
              : 50}%`
          }}>
            {arena.audience_votes.A}
          </div>
          <div style={{
            ...styles.voteB,
            width: `${arena.audience_votes.A + arena.audience_votes.B > 0
              ? (arena.audience_votes.B / (arena.audience_votes.A + arena.audience_votes.B)) * 100
              : 50}%`
          }}>
            {arena.audience_votes.B}
          </div>
        </div>
      </div>

      {/* Battle log */}
      <div style={styles.battleLog}>
        <div style={styles.logTitle}>⚔️ BATTLE LOG</div>
        <div style={styles.logScroll}>
          {(arena.moves || []).slice(-6).map((move, i) => (
            <div key={i} style={{
              ...styles.logEntry,
              borderLeft: move.fighter === "A" ? "3px solid #60a5fa" : "3px solid #f87171",
            }}>
              <span style={styles.logRound}>R{move.round}</span>
              <span style={styles.logFighter}>[{move.fighter}]</span>
              <span style={styles.logMoveName}>{move.move_name}</span>
              <span style={styles.logDamage}>-{move.damage}</span>
              <div style={styles.logNarration}>{move.narration}</div>
            </div>
          ))}
          {(!arena.moves || arena.moves.length === 0) && (
            <div style={styles.logEmpty}>等待出招...</div>
          )}
        </div>
      </div>

      {/* Pixel CSS animations */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-15px); }
          40% { transform: translateX(15px); }
          60% { transform: translateX(-10px); }
          80% { transform: translateX(10px); }
        }

        @keyframes flash {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }

        @keyframes slideIn {
          from { transform: scale(3) rotate(10deg); opacity: 0; }
          to { transform: scale(1) rotate(0deg); opacity: 1; }
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }

        @keyframes flicker {
          0% { opacity: 0.97; }
          5% { opacity: 0.9; }
          10% { opacity: 0.97; }
          50% { opacity: 1; }
          55% { opacity: 0.95; }
          60% { opacity: 1; }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }

        * { image-rendering: pixelated; }
      `}</style>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw",
    height: "100vh",
    background: "linear-gradient(180deg, #0a0a2e 0%, #1a0a3e 30%, #2a1a4e 60%, #1a0a2e 100%)",
    fontFamily: "'Press Start 2P', monospace",
    color: "#fff",
    overflow: "hidden",
    position: "relative",
    display: "flex",
    flexDirection: "column",
  },
  scanlines: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.1) 2px, rgba(0,0,0,0.1) 4px)",
    pointerEvents: "none",
    zIndex: 100,
  },
  loading: {
    fontSize: "24px",
    textAlign: "center",
    marginTop: "40vh",
    animation: "flash 1s infinite",
    color: "#fbbf24",
  },

  // HUD
  hud: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: "20px 30px",
    zIndex: 10,
  },
  hudLeft: { flex: 1 },
  hudCenter: {
    textAlign: "center",
    flex: 0.5,
    padding: "0 20px",
  },
  hudRight: {
    flex: 1,
    textAlign: "right",
  },
  playerName: {
    fontSize: "14px",
    marginBottom: "8px",
    textShadow: "2px 2px 0px #000",
    letterSpacing: "2px",
  },
  hpBarContainer: {
    width: "100%",
    height: "24px",
    backgroundColor: "#333",
    border: "3px solid #fff",
    position: "relative",
    imageRendering: "pixelated",
  },
  hpBar: {
    height: "100%",
    transition: "width 0.5s ease, background-color 0.3s",
  },
  hpText: {
    position: "absolute",
    top: "2px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "10px",
    textShadow: "1px 1px 0px #000",
  },
  mpBarContainer: {
    width: "100%",
    height: "14px",
    backgroundColor: "#333",
    border: "2px solid #888",
    position: "relative",
    marginTop: "4px",
  },
  mpBar: {
    height: "100%",
    backgroundColor: "#60a5fa",
    transition: "width 0.5s ease",
  },
  mpText: {
    position: "absolute",
    top: "0px",
    left: "50%",
    transform: "translateX(-50%)",
    fontSize: "7px",
    textShadow: "1px 1px 0px #000",
  },
  roundText: {
    fontSize: "20px",
    color: "#fbbf24",
    textShadow: "3px 3px 0px #000",
    animation: "pulse 2s infinite",
  },
  themeText: {
    fontSize: "8px",
    color: "#a78bfa",
    marginTop: "8px",
    letterSpacing: "3px",
  },
  timerText: {
    fontSize: "10px",
    color: "#34d399",
    marginTop: "8px",
  },

  // Stage
  stage: {
    flex: 1,
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-end",
    padding: "0 60px 20px",
    position: "relative",
    // Ground
    borderBottom: "4px solid #4a2a0a",
    background: "linear-gradient(0deg, rgba(74,42,10,0.3) 0%, transparent 30%)",
  },
  fighter: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    zIndex: 5,
  },
  fighterA: {},
  fighterB: {},
  pixelChar: {
    width: "120px",
    height: "160px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    animation: "float 3s ease-in-out infinite",
  },
  pixelAvatar: {
    fontSize: "80px",
    filter: "drop-shadow(4px 4px 0px #000)",
  },
  turnIndicator: {
    fontSize: "8px",
    color: "#fbbf24",
    animation: "flash 0.8s infinite",
    marginTop: "10px",
  },

  // Effects
  effectOverlay: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    zIndex: 20,
    animation: "slideIn 0.3s ease-out",
  },
  moveName: {
    fontSize: "28px",
    color: "#fbbf24",
    textShadow: "4px 4px 0px #000, -2px -2px 0px #f97316",
    marginBottom: "10px",
  },
  damageText: {
    fontSize: "36px",
    color: "#ef4444",
    textShadow: "3px 3px 0px #000",
  },
  creativityStars: {
    fontSize: "16px",
    marginTop: "10px",
  },
  vsText: {
    position: "absolute",
    top: "40%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    fontSize: "48px",
    color: "#ef4444",
    textShadow: "4px 4px 0px #000",
    animation: "pulse 1.5s infinite",
  },
  winnerOverlay: {
    position: "absolute",
    top: "35%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    textAlign: "center",
    zIndex: 30,
  },
  winnerText: {
    fontSize: "48px",
    color: "#fbbf24",
    textShadow: "4px 4px 0px #000, -2px -2px 0px #f97316",
    animation: "pulse 1s infinite",
  },
  winnerName: {
    fontSize: "18px",
    color: "#fff",
    marginTop: "20px",
    textShadow: "2px 2px 0px #000",
  },

  // Votes
  voteSection: {
    padding: "10px 30px",
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },
  voteLabel: {
    fontSize: "8px",
    whiteSpace: "nowrap",
  },
  voteBar: {
    flex: 1,
    height: "20px",
    display: "flex",
    border: "2px solid #fff",
    overflow: "hidden",
  },
  voteA: {
    backgroundColor: "#3b82f6",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "8px",
    transition: "width 0.5s ease",
    minWidth: "30px",
  },
  voteB: {
    backgroundColor: "#ef4444",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "8px",
    transition: "width 0.5s ease",
    minWidth: "30px",
  },

  // Battle log
  battleLog: {
    height: "180px",
    padding: "10px 30px",
    backgroundColor: "rgba(0,0,0,0.5)",
    borderTop: "3px solid #333",
  },
  logTitle: {
    fontSize: "10px",
    color: "#fbbf24",
    marginBottom: "8px",
  },
  logScroll: {
    height: "140px",
    overflowY: "auto",
    scrollbarWidth: "thin",
  },
  logEntry: {
    padding: "4px 8px",
    marginBottom: "4px",
    fontSize: "8px",
    lineHeight: "1.6",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  logRound: {
    color: "#a78bfa",
    marginRight: "8px",
  },
  logFighter: {
    color: "#fbbf24",
    marginRight: "6px",
  },
  logMoveName: {
    color: "#34d399",
    marginRight: "8px",
  },
  logDamage: {
    color: "#ef4444",
  },
  logNarration: {
    color: "#94a3b8",
    marginTop: "2px",
    fontSize: "7px",
    fontFamily: "sans-serif",
  },
  logEmpty: {
    color: "#666",
    fontSize: "10px",
    textAlign: "center",
    marginTop: "40px",
    animation: "flash 2s infinite",
  },
};
