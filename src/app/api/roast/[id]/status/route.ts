import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: battleId } = await params;

  const { data: battle } = await supabase
    .from("roast_battles")
    .select(`
      id, title, topic, status, current_round, max_rounds, current_turn,
      score_a, score_b, winner,
      roaster_a:participants!roaster_a_id(id, name, agent_name, avatar, bio),
      roaster_b:participants!roaster_b_id(id, name, agent_name, avatar, bio),
      winner_info:participants!winner_id(name, agent_name, avatar),
      created_at, finished_at
    `)
    .eq("id", battleId).single();

  if (!battle) return NextResponse.json({ error: "Battle 不存在" }, { status: 404 });

  const { data: lines } = await supabase
    .from("roast_lines")
    .select("round, roaster, line, judge_result, created_at")
    .eq("battle_id", battleId).order("created_at", { ascending: true });

  const { data: votes } = await supabase
    .from("roast_audience_votes").select("vote_for").eq("battle_id", battleId);

  return NextResponse.json({
    ...battle,
    lines: (lines || []).map(l => ({
      round: l.round,
      roaster: l.roaster,
      line: l.line,
      score: (l.judge_result as Record<string, unknown>)?.score,
      reaction: (l.judge_result as Record<string, unknown>)?.reaction,
      burn_level: (l.judge_result as Record<string, unknown>)?.burn_level,
      narration: (l.judge_result as Record<string, unknown>)?.narration,
    })),
    audience_votes: {
      A: (votes || []).filter(v => v.vote_for === "A").length,
      B: (votes || []).filter(v => v.vote_for === "B").length,
    },
  });
}
