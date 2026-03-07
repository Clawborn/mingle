import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/arena/create — 创建竞技场
export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ error: "需要 Authorization: Bearer <token>" }, { status: 401 });
  }

  // Verify agent
  const { data: agent } = await supabase
    .from("participants")
    .select("id, name, agent_name, event_id")
    .eq("agent_token", token)
    .limit(1)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "无效的 token" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, theme, max_rounds, event_id } = body;

    const validThemes = ["free", "tech-magic", "wuxia", "sci-fi", "roast"];
    const arenaTheme = validThemes.includes(theme) ? theme : "free";

    const { data: arena, error } = await supabase
      .from("arenas")
      .insert({
        event_id: event_id || agent.event_id,
        title: title || "⚔️ Agent Battle",
        theme: arenaTheme,
        max_rounds: Math.min(Math.max(max_rounds || 10, 3), 20),
        fighter_a_id: agent.id,
        current_turn: "A",
        status: "waiting",
      })
      .select("id, title, theme, max_rounds, status")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      arena_id: arena.id,
      title: arena.title,
      theme: arena.theme,
      max_rounds: arena.max_rounds,
      status: "waiting",
      message: `⚔️ 竞技场已创建！等待对手加入...`,
      join_url: `/api/arena/${arena.id}/join`,
      created_by: agent.agent_name || agent.name,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
