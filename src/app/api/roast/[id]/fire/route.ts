import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";
import { judgeRoast, type RoastJudgeInput } from "@/lib/roast-judge";
import { sanitizeRoastLine } from "@/lib/sanitize";

// POST /api/roast/:id/fire — 发射 roast
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: battleId } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name, bio")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  try {
    const rawBody = await request.json();
    if (!rawBody.line) return NextResponse.json({ error: "line 是必填项" }, { status: 400 });
    const line = sanitizeRoastLine(rawBody.line);

    const { data: battle } = await supabase
      .from("roast_battles").select("*").eq("id", battleId).single();
    if (!battle) return NextResponse.json({ error: "Battle 不存在" }, { status: 404 });
    if (battle.status !== "battling") return NextResponse.json({ error: `状态: ${battle.status}` }, { status: 400 });

    let role: "A" | "B";
    if (battle.roaster_a_id === agent.id) role = "A";
    else if (battle.roaster_b_id === agent.id) role = "B";
    else return NextResponse.json({ error: "你不在这场 battle 中" }, { status: 403 });

    if (battle.current_turn !== role) {
      return NextResponse.json({ error: "还没轮到你" }, { status: 400 });
    }

    const opponentId = role === "A" ? battle.roaster_b_id : battle.roaster_a_id;
    const { data: opponent } = await supabase
      .from("participants").select("name, agent_name, bio")
      .eq("id", opponentId).single();

    // Previous lines
    const { data: prevLines } = await supabase
      .from("roast_lines").select("roaster, line, judge_result")
      .eq("battle_id", battleId).order("created_at", { ascending: true });

    const previousLines = (prevLines || []).map(l => ({
      roaster: l.roaster,
      line: l.line,
      score: (l.judge_result as Record<string, unknown>)?.score as number || 0,
    }));

    const judgeInput: RoastJudgeInput = {
      topic: battle.topic || "自由发挥",
      round: battle.current_round,
      roaster_name: agent.agent_name || agent.name,
      roaster_bio: agent.bio || "",
      target_name: opponent?.agent_name || opponent?.name || "对手",
      target_bio: opponent?.bio || "",
      line,
      previous_lines: previousLines,
    };

    const judgment = await judgeRoast(judgeInput);

    // Save
    await supabase.from("roast_lines").insert({
      battle_id: battleId,
      round: battle.current_round,
      roaster: role,
      roaster_id: agent.id,
      line,
      judge_result: judgment,
    });

    // Update scores & turn
    const updateData: Record<string, unknown> = {
      current_turn: role === "A" ? "B" : "A",
    };

    if (role === "A") updateData.score_a = battle.score_a + judgment.score;
    else updateData.score_b = battle.score_b + judgment.score;

    // B completes a round
    const bothRoasted = role === "B";
    if (bothRoasted) {
      updateData.current_round = battle.current_round + 1;
    }

    const isLastRound = bothRoasted && battle.current_round >= battle.max_rounds;
    if (isLastRound) {
      updateData.status = "voting";
      updateData.finished_at = new Date().toISOString();

      // Determine winner by score
      const finalA = role === "A" ? battle.score_a + judgment.score : battle.score_a;
      const finalB = role === "B" ? battle.score_b + judgment.score : battle.score_b;
      if (finalA > finalB) {
        updateData.winner = "A";
        updateData.winner_id = battle.roaster_a_id;
      } else if (finalB > finalA) {
        updateData.winner = "B";
        updateData.winner_id = battle.roaster_b_id;
      } else {
        updateData.winner = "draw";
        updateData.status = "voting"; // tie → audience decides
      }
    }

    await supabase.from("roast_battles").update(updateData).eq("id", battleId);

    return NextResponse.json({
      round: battle.current_round,
      roaster: role,
      line,
      judgment: {
        score: judgment.score,
        reaction: judgment.reaction,
        burn_level: judgment.burn_level,
        narration: judgment.narration,
      },
      scores: {
        A: role === "A" ? battle.score_a + judgment.score : battle.score_a,
        B: role === "B" ? battle.score_b + judgment.score : battle.score_b,
      },
      battle_over: isLastRound,
      winner: isLastRound ? updateData.winner : null,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
