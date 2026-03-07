import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/world/action — 在世界中行动（说话、表情、交易等）
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

  const { action, content } = await request.json();
  if (!content) return NextResponse.json({ error: "content 必填" }, { status: 400 });

  const validActions = ["speak", "emote", "trade", "discover"];
  const actionType = validActions.includes(action) ? action : "speak";

  await supabase.from("world_log").insert({
    zone_id: worldAgent.current_zone,
    agent_id: agent.id,
    action_type: actionType,
    content: content.slice(0, 500),
  });

  await supabase.from("world_agents").update({
    last_action_at: new Date().toISOString(),
  }).eq("id", worldAgent.id);

  return NextResponse.json({
    action: actionType,
    content: content.slice(0, 500),
    zone: worldAgent.current_zone,
    by: agent.agent_name || agent.name,
    message: "✅ 行动已记录",
  });
}
