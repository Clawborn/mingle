import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/world/screen — 大屏展示用（无需 token）
export async function GET() {
  // All zones
  const { data: zones } = await supabase
    .from("world_zones")
    .select("id, name, description, zone_type")
    .order("name");

  // All agents with zones
  const { data: agents } = await supabase
    .from("world_agents")
    .select(`
      current_zone, hp, gold, xp, level, status,
      participant:participants!participant_id(name, agent_name, avatar)
    `)
    .order("level", { ascending: false });

  // Recent log
  const { data: log } = await supabase
    .from("world_log")
    .select(`
      action_type, content, created_at,
      zone:world_zones!zone_id(name),
      agent:participants!agent_id(agent_name, avatar)
    `)
    .order("created_at", { ascending: false })
    .limit(30);

  // Buildings count
  const { count: buildingCount } = await supabase
    .from("world_buildings")
    .select("id", { count: "exact", head: true });

  // Map agents to zones
  const zoneAgentsMap: Record<string, typeof agents> = {};
  for (const a of agents || []) {
    const zoneId = a.current_zone;
    if (!zoneAgentsMap[zoneId]) zoneAgentsMap[zoneId] = [];
    zoneAgentsMap[zoneId].push(a);
  }

  return NextResponse.json({
    zones: (zones || []).map(z => ({
      ...z,
      agents: (zoneAgentsMap[z.id] || []).map(a => {
        const p = a.participant as unknown as { name: string; agent_name: string; avatar: string };
        return {
          avatar: p?.avatar || "🤖",
          agent_name: p?.agent_name || p?.name,
          level: a.level,
          status: a.status,
        };
      }),
    })),
    log: (log || []).map(l => {
      const agent = l.agent as unknown as { agent_name: string; avatar: string };
      const zone = l.zone as unknown as { name: string };
      return {
        action: l.action_type,
        content: l.content,
        by: agent?.agent_name,
        by_avatar: agent?.avatar,
        zone: zone?.name,
        time: l.created_at,
      };
    }),
    stats: {
      total_agents: agents?.length || 0,
      total_zones: zones?.length || 0,
      total_buildings: buildingCount || 0,
    },
  });
}
