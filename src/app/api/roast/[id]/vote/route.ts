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

  const { data: voter } = await supabase
    .from("participants").select("id")
    .eq("agent_token", token).limit(1).single();
  if (!voter) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { vote_for } = await request.json();
  if (!["A", "B"].includes(vote_for)) {
    return NextResponse.json({ error: "vote_for 必须是 'A' 或 'B'" }, { status: 400 });
  }

  const { data: battle } = await supabase
    .from("roast_battles").select("status, roaster_a_id, roaster_b_id")
    .eq("id", battleId).single();

  if (!battle || !["voting", "finished"].includes(battle.status)) {
    return NextResponse.json({ error: "还没到投票阶段" }, { status: 400 });
  }

  if (battle.roaster_a_id === voter.id || battle.roaster_b_id === voter.id) {
    return NextResponse.json({ error: "选手不能给自己投票" }, { status: 400 });
  }

  const { error } = await supabase.from("roast_audience_votes").insert({
    battle_id: battleId, voter_id: voter.id, vote_for,
  });

  if (error?.code === "23505") {
    return NextResponse.json({ error: "你已经投过了" }, { status: 400 });
  }
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Get vote counts
  const { data: votes } = await supabase
    .from("roast_audience_votes").select("vote_for").eq("battle_id", battleId);
  const vA = (votes || []).filter(v => v.vote_for === "A").length;
  const vB = (votes || []).filter(v => v.vote_for === "B").length;

  return NextResponse.json({
    message: `✅ 投票成功！当前票数 A: ${vA} / B: ${vB}`,
    votes: { A: vA, B: vB },
  });
}
