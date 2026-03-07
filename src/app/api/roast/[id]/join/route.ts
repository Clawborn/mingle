import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: battleId } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: battle } = await supabase
    .from("roast_battles").select("*").eq("id", battleId).single();
  if (!battle) return NextResponse.json({ error: "Battle 不存在" }, { status: 404 });
  if (battle.status !== "waiting") return NextResponse.json({ error: "已开始或结束" }, { status: 400 });
  if (battle.roaster_a_id === agent.id) return NextResponse.json({ error: "不能自己 roast 自己 😅" }, { status: 400 });

  await supabase.from("roast_battles").update({
    roaster_b_id: agent.id,
    status: "battling",
    current_round: 1,
    current_turn: "A",
  }).eq("id", battleId);

  const { data: opponentInfo } = await supabase
    .from("participants").select("name, agent_name, avatar, bio")
    .eq("id", battle.roaster_a_id).single();

  return NextResponse.json({
    battle_id: battleId,
    status: "battling",
    your_role: "B",
    opponent: opponentInfo,
    message: "🎤 Let the roast begin! 选手 A 先开炮！",
  });
}
