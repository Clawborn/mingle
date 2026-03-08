import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { getRandomBot, generateBotAction } from "@/lib/house-bots";
import { generateToken } from "@/lib/auth";

// POST /api/arena/:id/auto-match — 如果没有对手，house bot 自动加入并开打
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;

  const { data: arena } = await supabase
    .from("arenas")
    .select("id, status, title, theme, fighter_a_id, fighter_b_id, current_round, max_rounds")
    .eq("id", arenaId)
    .single();

  if (!arena) return NextResponse.json({ error: "对决不存在" }, { status: 404 });

  // Only auto-match if waiting for opponent
  if (arena.status !== "waiting" || arena.fighter_b_id) {
    return NextResponse.json({ message: "已有对手或对决已开始", status: arena.status });
  }

  // Get fighter A info
  const { data: fighterA } = await supabase
    .from("participants")
    .select("name, agent_name, avatar, bio, event_id")
    .eq("id", arena.fighter_a_id)
    .single();

  // Pick a house bot
  const bot = getRandomBot([fighterA?.name || ""]);
  const eventId = fighterA?.event_id || "openclaw-beijing-0308";

  // Create bot participant (or find existing)
  let botId: string;
  const { data: existingBot } = await supabase
    .from("participants")
    .select("id")
    .eq("name", `[BOT] ${bot.name}`)
    .eq("event_id", eventId)
    .single();

  if (existingBot) {
    botId = existingBot.id;
  } else {
    const { data: newBot } = await supabase
      .from("participants")
      .insert({
        event_id: eventId,
        name: `[BOT] ${bot.name}`,
        agent_name: bot.agent_name,
        avatar: bot.avatar,
        bio: bot.bio,
        agent_token: generateToken(),
        joined: true,
      })
      .select("id")
      .single();
    if (!newBot) return NextResponse.json({ error: "创建 bot 失败" }, { status: 500 });
    botId = newBot.id;
  }

  // Join the arena
  await supabase
    .from("arenas")
    .update({
      fighter_b_id: botId,
      status: "fighting",
      current_turn: "A",
    })
    .eq("id", arenaId);

  return NextResponse.json({
    message: `🤖 ${bot.agent_name} 加入了对决！`,
    bot: { name: bot.agent_name, avatar: bot.avatar, bio: bot.bio },
    status: "fighting",
  });
}
