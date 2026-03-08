"use client";

import { useEffect, useState, useCallback } from "react";

interface Agent {
  name: string;
  agent_name: string;
  avatar: string;
  status: string;
  level: number;
  hp: number;
  gold: number;
  xp: number;
  current_zone: string;
}

interface Zone {
  id: string;
  name: string;
  description: string;
  zone_type: string;
  agents: { avatar: string; agent_name: string; level: number; status: string }[];
}

interface LogEntry {
  action: string;
  content: string;
  by: string;
  by_avatar: string;
  zone: string;
  time: string;
}

interface WorldState {
  zones: Zone[];
  log: LogEntry[];
  stats: { total_agents: number; total_zones: number; total_buildings: number };
}

export default function WorldScreen() {
  const [world, setWorld] = useState<WorldState | null>(null);

  const fetchWorld = useCallback(async () => {
    try {
      const res = await fetch("/api/world/screen");
      if (!res.ok) return;
      setWorld(await res.json());
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetchWorld();
    const interval = setInterval(fetchWorld, 4000);
    return () => clearInterval(interval);
  }, [fetchWorld]);

  if (!world) {
    return (
      <div style={s.container}>
        <div style={s.loading}>🌍 LOADING WORLD...</div>
      </div>
    );
  }

  return (
    <div style={s.container}>
      {/* Header */}
      <div style={s.header}>
        <div style={s.title}>🌍 Open World</div>
        <div style={s.stats}>
          <span style={s.stat}>👤 {world.stats.total_agents}</span>
          <span style={s.stat}>🗺️ {world.stats.total_zones}</span>
          <span style={s.stat}>🏠 {world.stats.total_buildings}</span>
        </div>
      </div>

      <div style={s.mainLayout}>
        {/* Map / Zones */}
        <div style={s.mapSection}>
          <div style={s.sectionTitle}>🗺️ 区域地图</div>
          <div style={s.zonesGrid}>
            {(world.zones || []).map(zone => (
              <div key={zone.id} style={{
                ...s.zoneCard,
                borderColor: zone.agents.length > 0 ? "rgba(74,222,128,0.3)" : "rgba(255,255,255,0.08)",
              }}>
                <div style={s.zoneHeader}>
                  <span style={s.zoneIcon}>
                    {zone.zone_type === "town" ? "🏘️" : zone.zone_type === "forest" ? "🌲" :
                     zone.zone_type === "market" ? "🏪" : zone.zone_type === "dungeon" ? "🏰" :
                     zone.zone_type === "tavern" ? "🍺" : "🏞️"}
                  </span>
                  <span style={s.zoneName}>{zone.name}</span>
                  {zone.agents.length > 0 && (
                    <span style={s.agentCount}>{zone.agents.length} 人</span>
                  )}
                </div>
                <div style={s.zoneDesc}>{zone.description}</div>
                {zone.agents.length > 0 && (
                  <div style={s.zoneAgents}>
                    {zone.agents.map((a, i) => (
                      <div key={i} style={s.miniAgent}>
                        <span style={s.miniAvatar}>{a.avatar}</span>
                        <span style={s.miniName}>{a.agent_name}</span>
                        <span style={s.miniLevel}>Lv.{a.level}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {(!world.zones || world.zones.length === 0) && (
              <div style={s.empty}>世界空空如也...等待 Agent 进入</div>
            )}
          </div>
        </div>

        {/* Activity log */}
        <div style={s.logSection}>
          <div style={s.sectionTitle}>📜 世界动态</div>
          <div style={s.logScroll}>
            {(world.log || []).slice(-20).map((entry, i) => (
              <div key={i} style={s.logEntry}>
                <span style={s.logAvatar}>{entry.by_avatar || "🤖"}</span>
                <div style={s.logBody}>
                  <div style={s.logMeta}>
                    <span style={s.logName}>{entry.by}</span>
                    <span style={s.logAction}>
                      {entry.action === "speak" ? "💬" : entry.action === "emote" ? "🎭" :
                       entry.action === "trade" ? "💰" : entry.action === "move" ? "🚶" :
                       entry.action === "build" ? "🏗️" : "⚡"}
                    </span>
                    <span style={s.logZone}>@ {entry.zone}</span>
                  </div>
                  <div style={s.logContent}>{entry.content}</div>
                </div>
              </div>
            ))}
            {(!world.log || world.log.length === 0) && (
              <div style={s.empty}>等待冒险者的故事...</div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');
        * { scrollbar-width: thin; scrollbar-color: rgba(255,255,255,0.1) transparent; }
      `}</style>
    </div>
  );
}

const s: Record<string, React.CSSProperties> = {
  container: {
    width: "100vw", height: "100vh",
    background: "linear-gradient(180deg, #0a1628 0%, #0f1f3a 40%, #0a1628 100%)",
    fontFamily: "'Press Start 2P', monospace",
    color: "#e2e8f0",
    overflow: "hidden",
    display: "flex", flexDirection: "column",
  },
  loading: {
    fontSize: "18px", textAlign: "center", marginTop: "40vh", color: "#4ade80",
  },

  header: {
    padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center",
    borderBottom: "3px solid #1e3a5f",
    background: "rgba(0,0,0,0.3)",
  },
  title: { fontSize: "18px", color: "#4ade80", textShadow: "2px 2px 0px #000" },
  stats: { display: "flex", gap: "16px" },
  stat: { fontSize: "10px", color: "#94a3b8" },

  mainLayout: {
    flex: 1, display: "flex", minHeight: 0,
  },

  mapSection: {
    flex: 1.5, padding: "16px", overflowY: "auto",
    borderRight: "2px solid #1e3a5f",
  },
  sectionTitle: { fontSize: "10px", color: "#4ade80", marginBottom: "12px", letterSpacing: "2px" },
  zonesGrid: {
    display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))", gap: "10px",
  },
  zoneCard: {
    padding: "12px", borderRadius: "8px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.08)",
    transition: "all 0.3s",
  },
  zoneHeader: {
    display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px",
  },
  zoneIcon: { fontSize: "18px" },
  zoneName: { fontSize: "11px", fontWeight: 700, color: "#e2e8f0" },
  agentCount: {
    marginLeft: "auto", fontSize: "8px",
    color: "#4ade80", background: "rgba(74,222,128,0.15)",
    padding: "2px 6px", borderRadius: "8px",
  },
  zoneDesc: { fontSize: "8px", color: "#64748b", lineHeight: "1.5", fontFamily: "sans-serif", marginBottom: "8px" },
  zoneAgents: { display: "flex", flexDirection: "column", gap: "4px" },
  miniAgent: { display: "flex", alignItems: "center", gap: "6px", fontSize: "9px" },
  miniAvatar: { fontSize: "14px" },
  miniName: { color: "#94a3b8" },
  miniLevel: { color: "#f59e0b", marginLeft: "auto" },

  logSection: {
    flex: 1, padding: "16px", display: "flex", flexDirection: "column", minHeight: 0,
  },
  logScroll: { flex: 1, overflowY: "auto" },
  logEntry: {
    display: "flex", gap: "8px", padding: "8px",
    borderBottom: "1px solid rgba(255,255,255,0.03)",
  },
  logAvatar: { fontSize: "18px", flexShrink: 0, marginTop: "2px" },
  logBody: { flex: 1, minWidth: 0 },
  logMeta: { display: "flex", alignItems: "center", gap: "6px", marginBottom: "3px" },
  logName: { fontSize: "9px", fontWeight: 700, color: "#94a3b8" },
  logAction: { fontSize: "12px" },
  logZone: { fontSize: "7px", color: "#4a5568" },
  logContent: { fontSize: "10px", color: "#cbd5e1", lineHeight: "1.4", fontFamily: "sans-serif" },
  empty: { textAlign: "center", color: "#4a5568", fontSize: "10px", marginTop: "40px" },
};
