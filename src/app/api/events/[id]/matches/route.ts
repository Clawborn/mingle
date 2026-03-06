import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/:id/matches?participant_id=xxx
// 获取某个参与者的匹配结果
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const participantId = request.nextUrl.searchParams.get("participant_id");

  if (!participantId) {
    // Return all matches for the event (public view)
    const { data, error } = await supabase
      .from("matches")
      .select(`
        id, reason, socials_exchanged, created_at,
        participant_a:participants!participant_a_id(id, name, avatar, bio, interests),
        participant_b:participants!participant_b_id(id, name, avatar, bio, interests)
      `)
      .eq("event_id", eventId)
      .order("created_at", { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ event_id: eventId, matches: data || [] });
  }

  // Get matches where this participant is involved
  const { data: matches, error } = await supabase
    .from("matches")
    .select(`
      id, reason, conversation_id, socials_exchanged, created_at,
      participant_a:participants!participant_a_id(id, name, avatar, bio, interests, socials),
      participant_b:participants!participant_b_id(id, name, avatar, bio, interests, socials)
    `)
    .eq("event_id", eventId)
    .or(`participant_a_id.eq.${participantId},participant_b_id.eq.${participantId}`);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Format: show the "other person" as the match
  const formatted = (matches || []).map((m: Record<string, unknown>) => {
    const isA = (m.participant_a as Record<string, unknown>)?.id === participantId;
    const other = isA ? m.participant_b : m.participant_a;
    const otherObj = other as Record<string, unknown>;

    return {
      matched_with: {
        id: otherObj.id,
        name: otherObj.name,
        avatar: otherObj.avatar,
        bio: otherObj.bio,
        interests: otherObj.interests,
      },
      reason: m.reason,
      socials: m.socials_exchanged ? otherObj.socials : undefined,
      conversation_id: m.conversation_id,
    };
  });

  return NextResponse.json({
    participant_id: participantId,
    matches: formatted,
  });
}

// POST /api/events/:id/matches
// 系统 / Agent 提交匹配结果
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const { conversation_id, reason } = await request.json();

    if (!conversation_id) {
      return NextResponse.json({ error: "conversation_id 是必填项" }, { status: 400 });
    }

    // Get conversation
    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .select("participant_a_id, participant_b_id")
      .eq("id", conversation_id)
      .single();

    if (convError || !conv) {
      return NextResponse.json({ error: "对话不存在" }, { status: 404 });
    }

    // Update conversation status
    await supabase
      .from("conversations")
      .update({ status: "matched", match_reason: reason })
      .eq("id", conversation_id);

    // Create match
    const { data: match, error } = await supabase
      .from("matches")
      .insert({
        event_id: eventId,
        participant_a_id: conv.participant_a_id,
        participant_b_id: conv.participant_b_id,
        conversation_id,
        reason: reason || "Agent 推荐匹配",
        socials_exchanged: true,
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      match_id: match.id,
      message: "✅ 匹配成功！双方联系方式已交换",
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
