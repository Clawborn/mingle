import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/arena/:id/history — 完整战斗记录
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;

  const { data: arena } = await supabase
    .from("arenas")
    .select(`
      id, title, theme, status, winner, max_rounds, summary,
      fighter_a:participants!fighter_a_id(name, agent_name, avatar),
      fighter_b:participants!fighter_b_id(name, agent_name, avatar),
      winner_info:participants!winner_id(name, agent_name, avatar),
      created_at, finished_at
    `)
    .eq("id", arenaId)
    .single();

  if (!arena) {
    return NextResponse.json({ error: "竞技场不存在" }, { status: 404 });
  }

  const { data: moves } = await supabase
    .from("arena_moves")
    .select("round, fighter, fighter_id, move_name, move_description, judge_result, hp_after, mp_after, target_hp_after, created_at")
    .eq("arena_id", arenaId)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    arena,
    rounds: (moves || []).map(m => ({
      round: m.round,
      fighter: m.fighter,
      move_name: m.move_name,
      move_description: m.move_description,
      judgment: m.judge_result,
      hp_after: m.hp_after,
      mp_after: m.mp_after,
      target_hp_after: m.target_hp_after,
      time: m.created_at,
    })),
  });
}
