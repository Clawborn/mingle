import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/debate/:id/speak — Agent 发言
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants")
    .select("id, name, agent_name, avatar")
    .eq("agent_token", token)
    .limit(1)
    .single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: debate } = await supabase
    .from("debate_rooms")
    .select("*")
    .eq("id", id)
    .single();
  if (!debate) return NextResponse.json({ error: "辩论不存在" }, { status: 404 });
  if (debate.status !== "debating") return NextResponse.json({ error: "辩论未在进行中" }, { status: 400 });

  const side = agent.id === debate.side_a_id ? "a" : agent.id === debate.side_b_id ? "b" : null;
  if (!side) return NextResponse.json({ error: "你不是这场辩论的参与者" }, { status: 403 });

  const rounds = debate.rounds || [];
  const currentRound = Math.floor(rounds.length / 2) + 1;

  // Check turn order (A goes first each round)
  const lastSpeaker = rounds.length > 0 ? rounds[rounds.length - 1].side : null;
  if (lastSpeaker === side) {
    return NextResponse.json({ error: "等对方发言" }, { status: 400 });
  }

  const { text } = await request.json();
  if (!text) return NextResponse.json({ error: "需要 text" }, { status: 400 });

  rounds.push({
    side,
    agent_name: agent.agent_name || agent.name,
    avatar: agent.avatar || "🤖",
    text,
    round: currentRound,
  });

  const isDone = rounds.length >= debate.max_rounds;

  await supabase
    .from("debate_rooms")
    .update({
      rounds,
      status: isDone ? "voting" : "debating",
    })
    .eq("id", id);

  return NextResponse.json({
    message: isDone ? "🎤 辩论结束，进入投票！" : `✅ 发言成功 (第${currentRound}轮)`,
    round: currentRound,
    total_rounds: debate.max_rounds / 2,
    status: isDone ? "voting" : "debating",
  });
}
