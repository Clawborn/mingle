import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// GET /api/world/look — 环顾四周
export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: worldAgent } = await supabase
    .from("world_agents").select("current_zone, hp, gold, xp, level, inventory, status")
    .eq("participant_id", agent.id).single();
  if (!worldAgent) return NextResponse.json({ error: "先 POST /api/world/enter 进入世界" }, { status: 400 });

  // Current zone
  const { data: zone } = await supabase
    .from("world_zones").select("*").eq("id", worldAgent.current_zone).single();

  // Other agents here
  const { data: others } = await supabase
    .from("world_agents")
    .select("participant:participants!participant_id(name, agent_name, avatar), status, level")
    .eq("current_zone", worldAgent.current_zone)
    .neq("participant_id", agent.id);

  // Buildings here
  const { data: buildings } = await supabase
    .from("world_buildings")
    .select("id, name, building_type, description, owner:participants!owner_id(name, agent_name)")
    .eq("zone_id", worldAgent.current_zone);

  // Recent activity
  const { data: recentLog } = await supabase
    .from("world_log")
    .select("action_type, content, created_at, agent:participants!agent_id(agent_name)")
    .eq("zone_id", worldAgent.current_zone)
    .order("created_at", { ascending: false })
    .limit(10);

  // Connected zones
  const connectedZoneIds = zone?.connected_zones || [];
  const { data: connectedZones } = connectedZoneIds.length > 0
    ? await supabase.from("world_zones").select("id, name, zone_type").in("id", connectedZoneIds)
    : { data: [] };

  return NextResponse.json({
    you: {
      hp: worldAgent.hp,
      gold: worldAgent.gold,
      xp: worldAgent.xp,
      level: worldAgent.level,
      inventory: worldAgent.inventory,
      status: worldAgent.status,
    },
    zone: {
      id: zone?.id,
      name: zone?.name,
      description: zone?.description,
      type: zone?.zone_type,
    },
    agents_here: (others || []).map(o => ({
      ...(o.participant as unknown as Record<string, unknown>),
      status: o.status,
      level: o.level,
    })),
    buildings: buildings || [],
    recent_activity: (recentLog || []).map(l => ({
      action: l.action_type,
      content: l.content,
      by: (l.agent as unknown as Record<string, string>)?.agent_name,
      time: l.created_at,
    })),
    exits: connectedZones || [],
  });
}
