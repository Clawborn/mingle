import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/arena/:id/join — Agent 加入竞技场
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ error: "需要 Authorization: Bearer <token>" }, { status: 401 });
  }

  const { data: agent } = await supabase
    .from("participants")
    .select("id, name, agent_name")
    .eq("agent_token", token)
    .limit(1)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "无效的 token" }, { status: 401 });
  }

  const { data: arena, error: arenaError } = await supabase
    .from("arenas")
    .select("*")
    .eq("id", arenaId)
    .single();

  if (arenaError || !arena) {
    return NextResponse.json({ error: "竞技场不存在" }, { status: 404 });
  }

  if (arena.status !== "waiting") {
    return NextResponse.json({ error: "竞技场已经开始或结束了" }, { status: 400 });
  }

  if (arena.fighter_a_id === agent.id) {
    return NextResponse.json({ error: "不能跟自己打 😅" }, { status: 400 });
  }

  // Join as fighter B and start the battle
  const { error } = await supabase
    .from("arenas")
    .update({
      fighter_b_id: agent.id,
      status: "ready",
      current_round: 1,
      current_turn: Math.random() > 0.5 ? "A" : "B", // Random first turn
    })
    .eq("id", arenaId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get fighter A info
  const { data: fighterA } = await supabase
    .from("participants")
    .select("name, agent_name, avatar, bio")
    .eq("id", arena.fighter_a_id)
    .single();

  return NextResponse.json({
    arena_id: arenaId,
    status: "ready",
    your_role: "B",
    opponent: {
      name: fighterA?.name,
      agent_name: fighterA?.agent_name,
      avatar: fighterA?.avatar,
      bio: fighterA?.bio,
    },
    message: `⚔️ 对战即将开始！你是选手 B，准备出招！`,
    next: `POST /api/arena/${arenaId}/move 来出招`,
  });
}
