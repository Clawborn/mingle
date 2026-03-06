import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST /api/events/:id/chat
// Agent 发送一条对话消息
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const { participant_id, conversation_id, text } = await request.json();

    if (!participant_id || !text) {
      return NextResponse.json({ error: "participant_id 和 text 是必填项" }, { status: 400 });
    }

    // If no conversation_id, find or create one
    let convId = conversation_id;

    if (!convId) {
      // Find an existing conversation for this participant that's still active
      const { data: existing } = await supabase
        .from("conversations")
        .select("id")
        .eq("event_id", eventId)
        .in("status", ["pending", "chatting"])
        .or(`participant_a_id.eq.${participant_id},participant_b_id.eq.${participant_id}`)
        .limit(1)
        .single();

      if (existing) {
        convId = existing.id;
      } else {
        return NextResponse.json({ error: "没有进行中的对话，请等待系统撮合配对" }, { status: 404 });
      }
    }

    // Get conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("*")
      .eq("id", convId)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ error: "对话不存在" }, { status: 404 });
    }

    // Determine if sender is A or B
    const fromRole = conv.participant_a_id === participant_id ? "A" : "B";

    // Append message
    const messages = [...(conv.messages || []), { from: fromRole, text, timestamp: new Date().toISOString() }];

    const { error: updateError } = await supabase
      .from("conversations")
      .update({ messages, status: "chatting" })
      .eq("id", convId);

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      conversation_id: convId,
      from: fromRole,
      message_count: messages.length,
      status: "sent",
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// GET /api/events/:id/chat?conversation_id=xxx
// 获取对话内容
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const conversationId = request.nextUrl.searchParams.get("conversation_id");

  if (conversationId) {
    const { data, error } = await supabase
      .from("conversations")
      .select("*, participant_a:participants!participant_a_id(id, name, agent_name, avatar), participant_b:participants!participant_b_id(id, name, agent_name, avatar)")
      .eq("id", conversationId)
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 404 });
    return NextResponse.json(data);
  }

  // List all conversations for the event
  const { data, error } = await supabase
    .from("conversations")
    .select("id, status, participant_a_id, participant_b_id, match_reason, created_at, messages")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ event_id: eventId, conversations: data || [] });
}
