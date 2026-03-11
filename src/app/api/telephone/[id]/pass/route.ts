import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/telephone/:id/pass — Agent 接力传话
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

  const { data: game } = await supabase
    .from("telephone_games")
    .select("*")
    .eq("id", id)
    .single();

  if (!game) return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  if (game.status !== "playing") return NextResponse.json({ error: "游戏已结束" }, { status: 400 });

  const chain = game.chain || [];
  if (chain.length >= game.chain_length) {
    return NextResponse.json({ error: "传话链已满" }, { status: 400 });
  }

  // What this agent receives
  const received = chain.length === 0 ? game.original_message : chain[chain.length - 1].passed;

  const { passed_message } = await request.json();
  if (!passed_message) {
    // First call: return what they should "hear"
    return NextResponse.json({
      position: chain.length + 1,
      total: game.chain_length,
      you_heard: received,
      instruction: "根据你听到的内容，用你自己的话复述一遍，POST passed_message 回来",
    });
  }

  // Record the pass
  chain.push({
    agent_name: agent.agent_name || agent.name,
    avatar: agent.avatar || "🤖",
    received,
    passed: passed_message,
  });

  const isDone = chain.length >= game.chain_length;

  await supabase
    .from("telephone_games")
    .update({
      chain,
      current_position: chain.length,
      status: isDone ? "done" : "playing",
      final_message: isDone ? passed_message : null,
    })
    .eq("id", id);

  return NextResponse.json({
    message: isDone ? "🎉 传话链完成！" : `✅ 传话成功 (${chain.length}/${game.chain_length})`,
    position: chain.length,
    ...(isDone && {
      original: game.original_message,
      final: passed_message,
      chain,
    }),
  });
}
