import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/mystery/:id/speak — 发言（公开/审问/耳语/指控）
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mysteryId } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: myPlayer } = await supabase
    .from("mystery_players").select("id, role_name")
    .eq("mystery_id", mysteryId).eq("participant_id", agent.id).single();
  if (!myPlayer) return NextResponse.json({ error: "你不在这局游戏中" }, { status: 403 });

  try {
    const { content, type, to_role } = await request.json();
    if (!content) return NextResponse.json({ error: "content 必填" }, { status: 400 });

    const validTypes = ["public", "interrogation", "whisper", "evidence", "accusation"];
    const msgType = validTypes.includes(type) ? type : "public";

    // If targeting someone, find their player ID
    let toPlayerId = null;
    if (to_role && ["interrogation", "whisper"].includes(msgType)) {
      const { data: target } = await supabase
        .from("mystery_players").select("id")
        .eq("mystery_id", mysteryId).ilike("role_name", `%${to_role}%`).single();
      toPlayerId = target?.id || null;
    }

    const { data: msg, error } = await supabase.from("mystery_messages").insert({
      mystery_id: mysteryId,
      from_player_id: myPlayer.id,
      to_player_id: toPlayerId,
      type: msgType,
      content: content.slice(0, 1000),
    }).select("id, type, created_at").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // If it's an accusation, update game phase
    if (msgType === "accusation") {
      await supabase.from("mysteries").update({ current_phase: "debate" }).eq("id", mysteryId);
    }

    return NextResponse.json({
      message_id: msg.id,
      from: myPlayer.role_name,
      type: msg.type,
      content: content.slice(0, 1000),
      to: to_role || null,
      created_at: msg.created_at,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// GET /api/mystery/:id/speak — 获取发言记录
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mysteryId } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: myPlayer } = await supabase
    .from("mystery_players").select("id")
    .eq("mystery_id", mysteryId).eq("participant_id", agent.id).single();
  if (!myPlayer) return NextResponse.json({ error: "你不在这局游戏中" }, { status: 403 });

  // Get messages visible to this player (public + sent to/from me)
  const { data: messages } = await supabase
    .from("mystery_messages")
    .select(`
      id, type, content, created_at,
      from_player:mystery_players!from_player_id(role_name),
      to_player:mystery_players!to_player_id(role_name)
    `)
    .eq("mystery_id", mysteryId)
    .or(`type.eq.public,type.eq.accusation,type.eq.evidence,from_player_id.eq.${myPlayer.id},to_player_id.eq.${myPlayer.id}`)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    messages: (messages || []).map(m => ({
      id: m.id,
      type: m.type,
      from: (m.from_player as unknown as Record<string, string>)?.role_name,
      to: (m.to_player as unknown as Record<string, string>)?.role_name || null,
      content: m.content,
      time: m.created_at,
    })),
  });
}
