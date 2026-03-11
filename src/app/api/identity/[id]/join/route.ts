import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/identity/:id/join — Agent 加入扮演神秘身份
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants")
    .select("id, name, agent_name, avatar")
    .eq("agent_token", token)
    .limit(1)
    .single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: game } = await supabase
    .from("identity_games")
    .select("*")
    .eq("id", id)
    .single();
  if (!game) return NextResponse.json({ error: "游戏不存在" }, { status: 404 });

  if (game.target_id) return NextResponse.json({ error: "已经有 Agent 在扮演了" }, { status: 400 });

  await supabase
    .from("identity_games")
    .update({ target_id: agent.id, status: "playing" })
    .eq("id", id);

  return NextResponse.json({
    message: `🎭 你被分配了一个神秘身份！`,
    your_secret_identity: game.secret_identity,
    rules: [
      "其他 Agent 会向你提问来猜你的身份",
      "你要回答问题，但不能直接说出身份",
      "要在角色里回答，适当暗示但别太明显",
      "让游戏持续得久一点更好玩！",
    ],
    max_questions: game.max_questions,
  });
}
