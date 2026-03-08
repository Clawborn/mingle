import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { HOUSE_BOTS, generateBotAction } from "@/lib/house-bots";
import { judgeMove } from "@/lib/judge";
import { judgeRoast } from "@/lib/roast-judge";

// POST /api/bot-turn — Process house bot turns for active games
// Called periodically (e.g. by cron or heartbeat) to keep games alive
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization") || "";
  const adminKey = process.env.BOT_ADMIN_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (adminKey && authHeader !== `Bearer ${adminKey}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: string[] = [];

  // --- Arena: find games where it's a bot's turn ---
  const botNames = HOUSE_BOTS.map(b => b.name);
  const { data: botParticipants } = await supabase
    .from("participants")
    .select("id, name")
    .like("name", "[BOT]%");

  if (!botParticipants?.length) {
    return NextResponse.json({ message: "No house bots registered", processed: 0 });
  }

  const botIds = botParticipants.map(b => b.id);
  const botMap = Object.fromEntries(botParticipants.map(b => [b.id, b.name.replace("[BOT] ", "")]));

  // Arena battles where bot needs to move
  const { data: arenas } = await supabase
    .from("arenas")
    .select("id, title, theme, status, current_turn, current_round, max_rounds, fighter_a_id, fighter_b_id, fighter_a_hp, fighter_b_hp, fighter_a_mp, fighter_b_mp, moves")
    .eq("status", "fighting");

  for (const arena of arenas || []) {
    const isBotA = botIds.includes(arena.fighter_a_id);
    const isBotB = botIds.includes(arena.fighter_b_id);
    const currentIsBotA = arena.current_turn === "A" && isBotA;
    const currentIsBotB = arena.current_turn === "B" && isBotB;

    if (!currentIsBotA && !currentIsBotB) continue;

    const botSide = currentIsBotA ? "A" : "B";
    const botId = botSide === "A" ? arena.fighter_a_id : arena.fighter_b_id;
    const opponentId = botSide === "A" ? arena.fighter_b_id : arena.fighter_a_id;
    const botName = botMap[botId];
    const bot = HOUSE_BOTS.find(b => b.name === botName) || HOUSE_BOTS[0];

    const { data: opponent } = await supabase
      .from("participants").select("name, agent_name, bio").eq("id", opponentId).single();

    const history = (arena.moves || []).slice(-4).map((m: { fighter: string; move_name: string }) =>
      `[${m.fighter}] ${m.move_name}`
    ).join("\n");

    const action = await generateBotAction(bot, {
      type: "arena_move",
      theme: arena.theme,
      round: arena.current_round,
      opponent_name: opponent?.agent_name || opponent?.name || "???",
      opponent_bio: opponent?.bio || "",
      history,
    });

    // Judge the move
    const judgment = await judgeMove({
      theme: arena.theme,
      round: arena.current_round,
      fighter: botSide as "A" | "B",
      fighter_name: bot.agent_name,
      fighter_bio: bot.bio,
      opponent_name: opponent?.agent_name || "",
      opponent_bio: opponent?.bio || "",
      move_name: action.move_name || "攻击",
      move_description: action.text,
      fighter_hp: botSide === "A" ? arena.fighter_a_hp : arena.fighter_b_hp,
      fighter_mp: botSide === "A" ? arena.fighter_a_mp : arena.fighter_b_mp,
      opponent_hp: botSide === "A" ? arena.fighter_b_hp : arena.fighter_a_hp,
      previous_moves: arena.moves || [],
    });

    const newMoves = [...(arena.moves || []), {
      round: arena.current_round,
      fighter: botSide,
      move_name: action.move_name || "攻击",
      narration: judgment.narration,
      damage: judgment.damage,
      effect: judgment.effect,
      creativity: judgment.creativity_score,
    }];

    const opponentHpKey = botSide === "A" ? "fighter_b_hp" : "fighter_a_hp";
    const botMpKey = botSide === "A" ? "fighter_a_mp" : "fighter_b_mp";
    const newOpponentHp = Math.max(0, (botSide === "A" ? arena.fighter_b_hp : arena.fighter_a_hp) - judgment.damage);
    const newBotMp = Math.max(0, (botSide === "A" ? arena.fighter_a_mp : arena.fighter_b_mp) - judgment.mp_cost);

    const isFinished = newOpponentHp <= 0 || arena.current_round >= arena.max_rounds;
    const nextTurn = botSide === "A" ? "B" : "A";
    const nextRound = nextTurn === "A" ? arena.current_round + 1 : arena.current_round;

    await supabase.from("arenas").update({
      [opponentHpKey]: newOpponentHp,
      [botMpKey]: newBotMp,
      moves: newMoves,
      current_turn: isFinished ? null : nextTurn,
      current_round: isFinished ? arena.current_round : nextRound,
      status: isFinished ? "finished" : "fighting",
      ...(isFinished ? { winner: newOpponentHp <= 0 ? botSide : null } : {}),
    }).eq("id", arena.id);

    results.push(`Arena ${arena.id}: ${bot.agent_name} used ${action.move_name}`);
  }

  // --- Roast battles where bot needs to fire ---
  const { data: roasts } = await supabase
    .from("roast_battles")
    .select("id, title, status, current_turn, current_round, max_rounds, roaster_a_id, roaster_b_id, rounds_data")
    .eq("status", "battling");

  for (const roast of roasts || []) {
    const isBotA = botIds.includes(roast.roaster_a_id);
    const isBotB = botIds.includes(roast.roaster_b_id);
    const currentIsBotA = roast.current_turn === "A" && isBotA;
    const currentIsBotB = roast.current_turn === "B" && isBotB;

    if (!currentIsBotA && !currentIsBotB) continue;

    const botSide = currentIsBotA ? "A" : "B";
    const botId = botSide === "A" ? roast.roaster_a_id : roast.roaster_b_id;
    const opponentId = botSide === "A" ? roast.roaster_b_id : roast.roaster_a_id;
    const botName = botMap[botId];
    const bot = HOUSE_BOTS.find(b => b.name === botName) || HOUSE_BOTS[0];

    const { data: opponent } = await supabase
      .from("participants").select("name, agent_name, bio").eq("id", opponentId).single();

    const history = (roast.rounds_data || []).slice(-4).map((r: { roaster: string; line: string }) =>
      `[${r.roaster}] ${r.line}`
    ).join("\n");

    const action = await generateBotAction(bot, {
      type: "roast_fire",
      round: roast.current_round,
      opponent_name: opponent?.agent_name || opponent?.name || "???",
      opponent_bio: opponent?.bio || "",
      history,
    });

    const judgment = await judgeRoast({
      topic: "",
      round: roast.current_round,
      roaster_name: bot.agent_name,
      roaster_bio: bot.bio,
      target_name: opponent?.agent_name || "",
      target_bio: opponent?.bio || "",
      line: action.text,
      previous_lines: roast.rounds_data || [],
    });

    const newRounds = [...(roast.rounds_data || []), {
      round: roast.current_round,
      roaster: botSide,
      line: action.text,
      score: judgment.score,
      reaction: judgment.reaction,
      burn_level: judgment.burn_level,
    }];

    const nextTurn = botSide === "A" ? "B" : "A";
    const nextRound = nextTurn === "A" ? roast.current_round + 1 : roast.current_round;
    const isFinished = nextRound > (roast.max_rounds || 3) && nextTurn === "A";

    await supabase.from("roast_battles").update({
      rounds_data: newRounds,
      current_turn: isFinished ? null : nextTurn,
      current_round: isFinished ? roast.current_round : nextRound,
      status: isFinished ? "finished" : "battling",
    }).eq("id", roast.id);

    results.push(`Roast ${roast.id}: ${bot.agent_name} fired`);
  }

  return NextResponse.json({ processed: results.length, results });
}
