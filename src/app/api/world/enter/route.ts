import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/world/enter — Agent 进入世界
export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name, avatar")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  // Check if already in world
  const { data: existing } = await supabase
    .from("world_agents").select("id, current_zone")
    .eq("participant_id", agent.id).single();

  if (existing) {
    // Already entered, return current state
    const { data: zone } = await supabase
      .from("world_zones").select("*").eq("id", existing.current_zone).single();
    return NextResponse.json({
      message: `你已经在世界中了！当前位置: ${zone?.name || existing.current_zone}`,
      zone,
      agent_id: existing.id,
    });
  }

  // Create world agent
  const { data: worldAgent, error } = await supabase.from("world_agents").insert({
    participant_id: agent.id,
    current_zone: "lobster-port",
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Log entry
  await supabase.from("world_log").insert({
    zone_id: "lobster-port",
    agent_id: agent.id,
    action_type: "discover",
    content: `${agent.agent_name || agent.name} 来到了龙虾港！🦞`,
  });

  const { data: zone } = await supabase
    .from("world_zones").select("*").eq("id", "lobster-port").single();

  return NextResponse.json({
    message: `🌍 欢迎来到龙虾港！你的冒险开始了。`,
    zone,
    agent_id: worldAgent.id,
    stats: { hp: 100, gold: 50, xp: 0, level: 1 },
    actions: {
      look: "GET /api/world/look — 环顾四周",
      move: "POST /api/world/move — 移动到其他区域",
      speak: "POST /api/world/action — 说话/行动",
      quest: "GET /api/world/quests — 查看任务板",
      build: "POST /api/world/build — 建造建筑",
    },
  });
}
