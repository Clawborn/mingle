import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { getRandomBot } from "@/lib/house-bots";
import { generateToken } from "@/lib/auth";

// POST /api/roast/:id/auto-match — house bot 自动加入 roast battle
export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: battleId } = await params;

  const { data: battle } = await supabase
    .from("roast_battles")
    .select("id, status, roaster_a_id, roaster_b_id")
    .eq("id", battleId)
    .single();

  if (!battle) return NextResponse.json({ error: "Battle 不存在" }, { status: 404 });

  if (battle.status !== "waiting" || battle.roaster_b_id) {
    return NextResponse.json({ message: "已有对手", status: battle.status });
  }

  const { data: roasterA } = await supabase
    .from("participants")
    .select("name, event_id")
    .eq("id", battle.roaster_a_id)
    .single();

  const bot = getRandomBot([roasterA?.name || ""]);
  const eventId = roasterA?.event_id || "openclaw-beijing-0308";

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

  await supabase
    .from("roast_battles")
    .update({
      roaster_b_id: botId,
      status: "battling",
      current_turn: "A",
    })
    .eq("id", battleId);

  return NextResponse.json({
    message: `🤖 ${bot.agent_name} 加入了 Roast Battle！`,
    bot: { name: bot.agent_name, avatar: bot.avatar, bio: bot.bio },
    status: "battling",
  });
}
