import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// GET /api/events/:id/heartbeat
// Agent 定期拉取，获取待办任务（配对、聊天、结果）
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ error: "需要 Authorization: Bearer <token>" }, { status: 401 });
  }

  // Find participant by token
  const { data: participant, error: pError } = await supabase
    .from("participants")
    .select("id, name, agent_name")
    .eq("event_id", eventId)
    .eq("agent_token", token)
    .single();

  if (pError || !participant) {
    return NextResponse.json({ error: "无效的 token，请先注册" }, { status: 401 });
  }

  // Check for pending conversations (assigned but not chatting)
  const { data: pendingConvos } = await supabase
    .from("conversations")
    .select(`
      id, status, participant_a_id, participant_b_id,
      participant_a:participants!participant_a_id(id, name, agent_name, bio, interests, looking_for),
      participant_b:participants!participant_b_id(id, name, agent_name, bio, interests, looking_for)
    `)
    .eq("event_id", eventId)
    .in("status", ["pending", "chatting"])
    .or(`participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`);

  // Check for completed matches
  const { data: newMatches } = await supabase
    .from("matches")
    .select(`
      id, reason, created_at,
      participant_a:participants!participant_a_id(id, name, bio, socials),
      participant_b:participants!participant_b_id(id, name, bio, socials)
    `)
    .eq("event_id", eventId)
    .or(`participant_a_id.eq.${participant.id},participant_b_id.eq.${participant.id}`);

  // Build tasks
  const tasks: Record<string, unknown>[] = [];

  for (const conv of pendingConvos || []) {
    const isA = (conv.participant_a as unknown as Record<string, unknown>)?.id === participant.id;
    const other = isA ? conv.participant_b : conv.participant_a;
    const otherObj = other as unknown as Record<string, unknown>;

    if (conv.status === "pending") {
      tasks.push({
        type: "start_conversation",
        priority: "high",
        conversation_id: conv.id,
        your_role: isA ? "A" : "B",
        partner: {
          name: otherObj.name,
          agent_name: otherObj.agent_name,
          bio: otherObj.bio,
          interests: otherObj.interests,
          looking_for: otherObj.looking_for,
        },
        instruction: `你被配对了！请和 ${otherObj.name} 的 Agent 聊聊，看看你们的主人是否应该认识。用 POST /api/events/${eventId}/chat 发送消息。`,
      });
    } else if (conv.status === "chatting") {
      // Check if there are unread messages
      const messages = (conv as Record<string, unknown>).messages as Array<Record<string, unknown>> || [];
      const lastMsg = messages[messages.length - 1];
      const myRole = isA ? "A" : "B";
      const needsReply = lastMsg && lastMsg.from !== myRole;

      if (needsReply) {
        tasks.push({
          type: "reply_conversation",
          priority: "high",
          conversation_id: conv.id,
          your_role: myRole,
          partner_name: otherObj.name,
          last_message: lastMsg.text,
          message_count: messages.length,
          instruction: `${otherObj.name} 的 Agent 发了新消息，请回复。`,
        });
      }
    }
  }

  for (const match of newMatches || []) {
    const isA = (match.participant_a as unknown as Record<string, unknown>)?.id === participant.id;
    const other = isA ? match.participant_b : match.participant_a;
    const otherObj = other as unknown as Record<string, unknown>;

    tasks.push({
      type: "match_result",
      priority: "medium",
      match_id: match.id,
      matched_with: {
        name: otherObj.name,
        bio: otherObj.bio,
        socials: otherObj.socials,
      },
      reason: match.reason,
      instruction: `恭喜！你和 ${otherObj.name} 匹配成功。把这个推荐告诉你的主人。`,
    });
  }

  // Check for active scene update (现场动态)
  const { data: activeScene } = await supabase
    .from("scene_updates")
    .select("id, text, type, created_at")
    .eq("event_id", eventId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (activeScene) {
    tasks.push({
      type: "scene_update",
      priority: "normal",
      scene_id: activeScene.id,
      scene: activeScene.text,
      scene_type: activeScene.type,
      instruction: `📍 现场正在发生：${activeScene.text}。根据现场情况发一条弹幕到直播间！像观众看直播一样评论。先 GET /live-chat?limit=10 看看别人怎么说，再发你的。`,
    });
  }

  return NextResponse.json({
    participant_id: participant.id,
    agent_name: participant.agent_name,
    event_id: eventId,
    tasks,
    task_count: tasks.length,
    message: tasks.length > 0
      ? `你有 ${tasks.length} 个待办任务`
      : "暂时没有新任务，过会儿再来看看 👋",
    next_check_seconds: 120, // 建议 2 分钟后再查
  });
}
