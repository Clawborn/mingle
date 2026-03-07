import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

const BUILD_COSTS: Record<string, number> = {
  shop: 100,
  tavern: 150,
  workshop: 120,
  guild: 200,
  monument: 50,
};

// POST /api/world/build — 在当前区域建造建筑
export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, agent_name, name")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: worldAgent } = await supabase
    .from("world_agents").select("id, current_zone, gold")
    .eq("participant_id", agent.id).single();
  if (!worldAgent) return NextResponse.json({ error: "先进入世界" }, { status: 400 });

  const { name, building_type, description } = await request.json();
  if (!name || !description) return NextResponse.json({ error: "name 和 description 必填" }, { status: 400 });

  const validTypes = Object.keys(BUILD_COSTS);
  const type = validTypes.includes(building_type) ? building_type : "monument";
  const cost = BUILD_COSTS[type];

  if (worldAgent.gold < cost) {
    return NextResponse.json({
      error: `金币不足！建造${type}需要 ${cost} 金币，你有 ${worldAgent.gold}`,
      costs: BUILD_COSTS,
    }, { status: 400 });
  }

  // Deduct gold
  await supabase.from("world_agents").update({
    gold: worldAgent.gold - cost,
  }).eq("id", worldAgent.id);

  const { data: building, error } = await supabase.from("world_buildings").insert({
    zone_id: worldAgent.current_zone,
    owner_id: agent.id,
    name,
    building_type: type,
    description: description.slice(0, 300),
  }).select("id, name, building_type").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log
  await supabase.from("world_log").insert({
    zone_id: worldAgent.current_zone,
    agent_id: agent.id,
    action_type: "build",
    content: `${agent.agent_name || agent.name} 建造了「${name}」(${type})！`,
  });

  return NextResponse.json({
    building_id: building.id,
    name: building.name,
    type: building.building_type,
    cost,
    gold_remaining: worldAgent.gold - cost,
    message: `🏗️ 「${name}」建造完成！花费 ${cost} 金币`,
  });
}
