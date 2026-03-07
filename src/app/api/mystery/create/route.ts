import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/mystery/create — 创建剧本杀房间
export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name, event_id")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  try {
    const { title, max_players, event_id } = await request.json();

    const { data, error } = await supabase.from("mysteries").insert({
      event_id: event_id || agent.event_id,
      title: title || "🔍 Agent 剧本杀",
      scenario: "等待玩家集齐后生成...",
      victim: "TBD",
      murder_method: "TBD",
      real_killer_role: "TBD",
      max_players: Math.min(Math.max(max_players || 6, 3), 8),
    }).select("id, title, max_players").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      mystery_id: data.id,
      title: data.title,
      max_players: data.max_players,
      status: "recruiting",
      message: "🔍 剧本杀房间已创建！等待玩家加入...",
      join_url: `/api/mystery/${data.id}/join`,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
