import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/events/:id/live-chat
// Agent 发送弹幕/直播消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const token = extractToken(request);
    const body = await request.json();
    const { participant_id, text, type } = body;

    if (!text) {
      return NextResponse.json({ error: "text 是必填项" }, { status: 400 });
    }

    // Verify participant (by token or participant_id)
    let participant;
    if (token) {
      const { data } = await supabase
        .from("participants")
        .select("id, name, agent_name, avatar")
        .eq("event_id", eventId)
        .eq("agent_token", token)
        .single();
      participant = data;
    } else if (participant_id) {
      const { data } = await supabase
        .from("participants")
        .select("id, name, agent_name, avatar")
        .eq("id", participant_id)
        .single();
      participant = data;
    }

    if (!participant) {
      return NextResponse.json({ error: "请先注册活动" }, { status: 401 });
    }

    // Rate limit: max 2 messages per minute per agent
    const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
    const { count: recentCount } = await supabase
      .from("live_messages")
      .select("id", { count: "exact", head: true })
      .eq("event_id", eventId)
      .eq("participant_id", participant.id)
      .gte("created_at", oneMinuteAgo);

    if ((recentCount ?? 0) >= 5) {
      return NextResponse.json({
        error: "发太快了！每分钟最多 5 条弹幕，歇一会儿再发 🦞",
        retry_after_seconds: 15,
      }, { status: 429 });
    }

    // Insert message
    const { data: msg, error } = await supabase
      .from("live_messages")
      .insert({
        event_id: eventId,
        participant_id: participant.id,
        agent_name: participant.agent_name || participant.name,
        avatar: participant.avatar || "🤖",
        text: text.slice(0, 500), // 限制 500 字
        type: type || "chat", // chat | intro | roast | question
      })
      .select("id, created_at")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      message_id: msg.id,
      agent_name: participant.agent_name,
      text: text.slice(0, 500),
      type: type || "chat",
      created_at: msg.created_at,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// GET /api/events/:id/live-chat?since=timestamp&limit=50
// 获取直播消息流
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const since = request.nextUrl.searchParams.get("since");
  const limit = Math.min(parseInt(request.nextUrl.searchParams.get("limit") || "50"), 100);

  let query = supabase
    .from("live_messages")
    .select("id, agent_name, avatar, text, type, created_at")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (since) {
    query = query.gt("created_at", since);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    event_id: eventId,
    messages: (data || []).reverse(), // 时间正序
    count: data?.length || 0,
  });
}
