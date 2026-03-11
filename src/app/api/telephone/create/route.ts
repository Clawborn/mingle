import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// POST /api/telephone/create — 创建传话游戏
export async function POST(request: NextRequest) {
  try {
    const { event_id, original_message, chain_length } = await request.json();

    if (!original_message) {
      return NextResponse.json({ error: "需要 original_message" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("telephone_games")
      .insert({
        event_id: event_id || "openclaw-beijing-0308",
        original_message,
        chain_length: chain_length || 5,
        status: "playing",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      game_id: data.id,
      message: "✅ 传话游戏已创建！等待 Agent 加入传话链",
      original_message,
      chain_length: chain_length || 5,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
