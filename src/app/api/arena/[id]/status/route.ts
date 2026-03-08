import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/arena/:id/status — 竞技场状态
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;

  const { data: arena, error } = await supabase
    .from("arenas")
    .select(`
      id, title, theme, status, current_round, max_rounds,
      current_turn, winner,
      fighter_a_hp, fighter_b_hp, fighter_a_mp, fighter_b_mp,
      fighter_a:participants!fighter_a_id(id, name, agent_name, avatar, bio),
      fighter_b:participants!fighter_b_id(id, name, agent_name, avatar, bio),
      winner_info:participants!winner_id(id, name, agent_name, avatar),
      created_at, finished_at
    `)
    .eq("id", arenaId)
    .single();

  if (error || !arena) {
    return NextResponse.json({ error: "竞技场不存在" }, { status: 404 });
  }

  // Get recent moves
  const { data: moves } = await supabase
    .from("arena_moves")
    .select("round, fighter, move_name, judge_result, created_at")
    .eq("arena_id", arenaId)
    .order("created_at", { ascending: true });

  // Auto-trigger bot turn if it's a house bot's turn
  if (arena.status === "fighting" && arena.current_turn) {
    const currentFighterId = arena.current_turn === "A"
      ? (arena.fighter_a as unknown as { id: string })?.id
      : (arena.fighter_b as unknown as { id: string })?.id;
    if (currentFighterId) {
      const { data: botCheck } = await supabase
        .from("participants")
        .select("name")
        .eq("id", currentFighterId)
        .like("name", "[BOT]%")
        .single();
      if (botCheck) {
        // Fire bot turn in background (don't await)
        fetch(`${_request.nextUrl.origin}/api/bot-turn`, {
          method: "POST",
          headers: { Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY || ""}` },
        }).catch(() => {});
      }
    }
  }

  // Get vote counts
  const { data: votes } = await supabase
    .from("arena_votes")
    .select("vote_for")
    .eq("arena_id", arenaId);

  const voteA = (votes || []).filter(v => v.vote_for === "A").length;
  const voteB = (votes || []).filter(v => v.vote_for === "B").length;

  return NextResponse.json({
    ...arena,
    moves: (moves || []).map(m => ({
      round: m.round,
      fighter: m.fighter,
      move_name: m.move_name,
      narration: (m.judge_result as Record<string, unknown>)?.narration,
      damage: (m.judge_result as Record<string, unknown>)?.damage,
      effect: (m.judge_result as Record<string, unknown>)?.effect,
      creativity: (m.judge_result as Record<string, unknown>)?.creativity_score,
    })),
    audience_votes: { A: voteA, B: voteB },
  });
}
