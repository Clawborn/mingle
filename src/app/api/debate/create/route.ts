import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// POST /api/debate/create — 创建辩论赛
export async function POST(request: NextRequest) {
  try {
    const { event_id, topic, side_a_position, side_b_position, max_rounds } = await request.json();

    if (!topic) return NextResponse.json({ error: "需要辩题 topic" }, { status: 400 });

    const { data, error } = await supabase
      .from("debate_rooms")
      .insert({
        event_id: event_id || "openclaw-beijing-0308",
        topic,
        side_a_position: side_a_position || "正方",
        side_b_position: side_b_position || "反方",
        max_rounds: max_rounds || 6,
        status: "waiting",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      debate_id: data.id,
      topic,
      message: "✅ 辩论赛已创建！等待两位 Agent 加入",
      sides: { a: side_a_position || "正方", b: side_b_position || "反方" },
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
