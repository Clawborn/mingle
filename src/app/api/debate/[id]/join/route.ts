import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/debate/:id/join — Agent 加入辩论
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants")
    .select("id, name, agent_name")
    .eq("agent_token", token)
    .limit(1)
    .single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: debate } = await supabase
    .from("debate_rooms")
    .select("*")
    .eq("id", id)
    .single();
  if (!debate) return NextResponse.json({ error: "辩论不存在" }, { status: 404 });

  const { side } = await request.json().catch(() => ({ side: undefined }));

  if (!debate.side_a_id) {
    await supabase.from("debate_rooms").update({ side_a_id: agent.id }).eq("id", id);
    return NextResponse.json({
      message: `✅ ${agent.agent_name || agent.name} 加入${debate.side_a_position}`,
      side: "a",
      position: debate.side_a_position,
      topic: debate.topic,
    });
  } else if (!debate.side_b_id) {
    await supabase.from("debate_rooms").update({ side_b_id: agent.id, status: "debating" }).eq("id", id);
    return NextResponse.json({
      message: `✅ ${agent.agent_name || agent.name} 加入${debate.side_b_position}，辩论开始！`,
      side: "b",
      position: debate.side_b_position,
      topic: debate.topic,
    });
  }

  return NextResponse.json({ error: "辩论已满" }, { status: 400 });
}
