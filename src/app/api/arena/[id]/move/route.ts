import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";
import { judgeMove, type JudgeInput } from "@/lib/judge";
import { sanitizeMove } from "@/lib/sanitize";

// POST /api/arena/:id/move — 出招
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
    .select("id, name, agent_name, bio")
    .eq("agent_token", token)
    .limit(1)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "无效的 token" }, { status: 401 });
  }

  try {
    const rawBody = await request.json();

    if (!rawBody.move_name || !rawBody.move_description) {
      return NextResponse.json({ error: "move_name 和 move_description 是必填项" }, { status: 400 });
    }

    const { move_name, move_description } = sanitizeMove(rawBody.move_name, rawBody.move_description);

    // Get arena
    const { data: arena, error: arenaError } = await supabase
      .from("arenas")
      .select("*")
      .eq("id", arenaId)
      .single();

    if (arenaError || !arena) {
      return NextResponse.json({ error: "竞技场不存在" }, { status: 404 });
    }

    if (!["ready", "fighting"].includes(arena.status)) {
      return NextResponse.json({ error: `竞技场状态: ${arena.status}，无法出招` }, { status: 400 });
    }

    // Determine fighter role
    let role: "A" | "B";
    if (arena.fighter_a_id === agent.id) role = "A";
    else if (arena.fighter_b_id === agent.id) role = "B";
    else return NextResponse.json({ error: "你不在这场对战中" }, { status: 403 });

    if (arena.current_turn !== role) {
      return NextResponse.json({ error: "还没轮到你，等对手出招" }, { status: 400 });
    }

    // Get opponent info
    const opponentId = role === "A" ? arena.fighter_b_id : arena.fighter_a_id;
    const { data: opponent } = await supabase
      .from("participants")
      .select("name, agent_name, bio")
      .eq("id", opponentId)
      .single();

    // Get previous moves
    const { data: prevMoves } = await supabase
      .from("arena_moves")
      .select("fighter, move_name, judge_result")
      .eq("arena_id", arenaId)
      .order("created_at", { ascending: true });

    const previousMoves = (prevMoves || []).map(m => ({
      fighter: m.fighter,
      move_name: m.move_name,
      narration: (m.judge_result as Record<string, unknown>)?.narration as string || "",
    }));

    // Judge the move
    const fighterHp = role === "A" ? arena.fighter_a_hp : arena.fighter_b_hp;
    const fighterMp = role === "A" ? arena.fighter_a_mp : arena.fighter_b_mp;
    const opponentHp = role === "A" ? arena.fighter_b_hp : arena.fighter_a_hp;

    const judgeInput: JudgeInput = {
      theme: arena.theme,
      round: arena.current_round,
      fighter: role,
      fighter_name: agent.agent_name || agent.name,
      fighter_bio: agent.bio || "",
      opponent_name: opponent?.agent_name || opponent?.name || "对手",
      opponent_bio: opponent?.bio || "",
      move_name,
      move_description,
      fighter_hp: fighterHp,
      fighter_mp: fighterMp,
      opponent_hp: opponentHp,
      previous_moves: previousMoves,
    };

    const judgment = await judgeMove(judgeInput);

    // Calculate new HP/MP
    const newFighterMp = Math.max(0, fighterMp - judgment.mp_cost) + 5; // natural MP regen
    const newOpponentHp = Math.max(0, opponentHp - judgment.damage);

    // Save move
    await supabase.from("arena_moves").insert({
      arena_id: arenaId,
      round: arena.current_round,
      fighter: role,
      fighter_id: agent.id,
      move_name,
      move_description,
      judge_result: judgment,
      hp_after: fighterHp,
      mp_after: Math.min(50, newFighterMp),
      target_hp_after: newOpponentHp,
    });

    // Update arena state
    const updateData: Record<string, unknown> = {
      status: "fighting",
      current_turn: role === "A" ? "B" : "A",
    };

    if (role === "A") {
      updateData.fighter_a_mp = Math.min(50, newFighterMp);
      updateData.fighter_b_hp = newOpponentHp;
    } else {
      updateData.fighter_b_mp = Math.min(50, newFighterMp);
      updateData.fighter_a_hp = newOpponentHp;
    }

    // Check for KO
    const isKo = newOpponentHp <= 0;

    // Check if both fighters moved this round → advance round
    const bothMoved = role === "B"; // A goes first each round, B completes it
    if (bothMoved && !isKo) {
      updateData.current_round = arena.current_round + 1;
    }

    // Check for game over
    const isMaxRounds = bothMoved && arena.current_round >= arena.max_rounds;
    if (isKo || isMaxRounds) {
      updateData.status = "finished";
      updateData.finished_at = new Date().toISOString();

      if (isKo) {
        updateData.winner = role;
        updateData.winner_id = agent.id;
      } else {
        // Compare HP
        const finalAHp = role === "A" ? fighterHp : newOpponentHp;
        const finalBHp = role === "A" ? newOpponentHp : fighterHp;
        if (finalAHp > finalBHp) {
          updateData.winner = "A";
          updateData.winner_id = arena.fighter_a_id;
        } else if (finalBHp > finalAHp) {
          updateData.winner = "B";
          updateData.winner_id = arena.fighter_b_id;
        } else {
          updateData.winner = "draw";
        }
      }
    }

    await supabase.from("arenas").update(updateData).eq("id", arenaId);

    return NextResponse.json({
      round: arena.current_round,
      fighter: role,
      move_name,
      judgment: {
        damage: judgment.damage,
        effect: judgment.effect,
        mp_cost: judgment.mp_cost,
        creativity_score: judgment.creativity_score,
        narration: judgment.narration,
      },
      state: {
        your_hp: fighterHp,
        your_mp: Math.min(50, newFighterMp),
        opponent_hp: newOpponentHp,
      },
      game_over: isKo || isMaxRounds,
      winner: isKo ? role : (isMaxRounds ? updateData.winner : null),
      next_turn: isKo || isMaxRounds ? null : (role === "A" ? "B" : "A"),
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
