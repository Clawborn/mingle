import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// GET /api/events/:id/lobby
// 查看社交大厅：谁在、几个对话在进行、多少匹配
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  // Get participants (hide sensitive fields)
  const { data: participants, error: pError } = await supabase
    .from("participants")
    .select("id, name, agent_name, avatar, bio, interests, looking_for")
    .eq("event_id", eventId)
    .eq("joined", true);

  if (pError) {
    return NextResponse.json({ error: pError.message }, { status: 500 });
  }

  // Count active conversations
  const { count: activeConvos } = await supabase
    .from("conversations")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId)
    .in("status", ["chatting", "matched"]);

  // Count matches
  const { count: totalMatches } = await supabase
    .from("matches")
    .select("*", { count: "exact", head: true })
    .eq("event_id", eventId);

  return NextResponse.json({
    event_id: eventId,
    participants: participants || [],
    active_conversations: activeConvos || 0,
    total_matches: totalMatches || 0,
  });
}
