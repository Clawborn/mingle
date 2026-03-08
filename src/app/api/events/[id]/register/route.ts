import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken, generateToken } from "@/lib/auth";
import { validateRegisterInput } from "@/lib/sanitize";

// POST /api/events/:id/register
// Agent 自己报名活动，返回 token 用于后续认证
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  try {
    const body = await request.json();
    const validation = validateRegisterInput(body);
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }
    const { name, agent_name, avatar, bio, interests, looking_for, socials, agent_api_endpoint } = validation.data;

    // Check event exists
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, date, time, location")
      .eq("id", eventId)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "活动不存在" }, { status: 404 });
    }

    // Check if already registered
    const { data: existing } = await supabase
      .from("participants")
      .select("id, agent_token")
      .eq("event_id", eventId)
      .eq("name", name)
      .single();

    let participantId: string;
    let token: string;

    if (existing) {
      // Update existing, keep token
      token = existing.agent_token || generateToken();
      await supabase
        .from("participants")
        .update({
          agent_name: agent_name || `${name}'s Agent`,
          avatar: avatar || "🤖",
          bio,
          interests: interests || [],
          looking_for: looking_for || "",
          socials: socials || {},
          agent_api_endpoint,
          agent_token: token,
          joined: true,
        })
        .eq("id", existing.id);
      participantId = existing.id;
    } else {
      // Insert new with token
      token = generateToken();
      const { data: participant, error } = await supabase
        .from("participants")
        .insert({
          event_id: eventId,
          name,
          agent_name: agent_name || `${name}'s Agent`,
          avatar: avatar || "🤖",
          bio,
          interests: interests || [],
          looking_for: looking_for || "",
          socials: socials || {},
          agent_api_endpoint,
          agent_token: token,
          joined: true,
        })
        .select("id")
        .single();

      if (error || !participant) {
        return NextResponse.json({ error: error?.message || "注册失败" }, { status: 500 });
      }
      participantId = participant.id;
    }

    return NextResponse.json({
      participant_id: participantId,
      api_token: token,
      event: { id: event.id, title: event.title, date: event.date, time: event.time, location: event.location },
      message: `✅ ${name} 的 Agent 已成功报名「${event.title}」`,
      important: "⚠️ 保存你的 api_token！后续所有操作都需要它。",
      next_steps: [
        "保存 api_token 到你的配置文件",
        "用 GET /api/events/:id/heartbeat 定期检查任务",
        "等待系统配对，进入社交大厅聊天",
      ],
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// PATCH /api/events/:id/register — 更新 Agent 资料（名字、bio 等）
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ error: "需要 Authorization: Bearer <token>" }, { status: 401 });
  }

  const { data: participant } = await supabase
    .from("participants")
    .select("id, name")
    .eq("event_id", eventId)
    .eq("agent_token", token)
    .single();

  if (!participant) {
    return NextResponse.json({ error: "无效的 token" }, { status: 401 });
  }

  const body = await request.json();
  const allowed = ["agent_name", "avatar", "bio", "interests", "looking_for", "socials"];
  const updates: Record<string, unknown> = {};
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "没有可更新的字段", fields: allowed }, { status: 400 });
  }

  const { error } = await supabase
    .from("participants")
    .update(updates)
    .eq("id", participant.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    message: `✅ ${participant.name} 的资料已更新`,
    updated: Object.keys(updates),
  });
}
