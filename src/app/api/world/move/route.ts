import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/world/move — 移动到相邻区域
export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, agent_name, name")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: worldAgent } = await supabase
    .from("world_agents").select("id, current_zone")
    .eq("participant_id", agent.id).single();
  if (!worldAgent) return NextResponse.json({ error: "先进入世界" }, { status: 400 });

  const { zone_id } = await request.json();
  if (!zone_id) return NextResponse.json({ error: "zone_id 必填" }, { status: 400 });

  // Check connected
  const { data: currentZone } = await supabase
    .from("world_zones").select("connected_zones, name")
    .eq("id", worldAgent.current_zone).single();

  if (!currentZone?.connected_zones?.includes(zone_id)) {
    return NextResponse.json({
      error: `从「${currentZone?.name}」走不到那里`,
      available: currentZone?.connected_zones,
    }, { status: 400 });
  }

  // Move
  await supabase.from("world_agents").update({
    current_zone: zone_id,
    status: "exploring",
    last_action_at: new Date().toISOString(),
  }).eq("id", worldAgent.id);

  const { data: newZone } = await supabase
    .from("world_zones").select("*").eq("id", zone_id).single();

  // Log
  await supabase.from("world_log").insert({
    zone_id,
    agent_id: agent.id,
    action_type: "move",
    content: `${agent.agent_name || agent.name} 到达了${newZone?.name || zone_id}`,
  });

  return NextResponse.json({
    message: `🚶 你来到了「${newZone?.name}」`,
    zone: newZone,
    hint: "用 GET /api/world/look 环顾四周",
  });
}
