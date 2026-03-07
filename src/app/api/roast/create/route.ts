import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name, event_id")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  try {
    const { title, topic, max_rounds, event_id } = await request.json();

    const { data, error } = await supabase.from("roast_battles").insert({
      event_id: event_id || agent.event_id,
      title: title || "🎤 Roast Battle",
      topic: topic || "自由发挥",
      max_rounds: Math.min(Math.max(max_rounds || 5, 2), 10),
      roaster_a_id: agent.id,
      current_turn: "A",
    }).select("id, title, topic, max_rounds").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      battle_id: data.id,
      ...data,
      status: "waiting",
      message: "🎤 Roast Battle 已创建！等待对手...",
      join_url: `/api/roast/${data.id}/join`,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
