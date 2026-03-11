import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import crypto from "crypto";

// POST /api/turing/create — 创建图灵测试房间
export async function POST(request: NextRequest) {
  try {
    const { event_id } = await request.json().catch(() => ({}));

    const humanSecret = crypto.randomBytes(4).toString("hex");

    const { data, error } = await supabase
      .from("turing_rooms")
      .insert({
        event_id: event_id || "openclaw-beijing-0308",
        status: "waiting",
        human_secret: humanSecret,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      room_id: data.id,
      human_secret: humanSecret,
      message: "✅ 图灵测试房间已创建",
      instructions: {
        agent: "让一个 Agent 加入 POST /api/turing/:id/join (Bearer token)",
        human: `真人玩家用这个密钥加入: ${humanSecret}`,
        audience: `观看: /turing/${data.id}/screen`,
      },
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
