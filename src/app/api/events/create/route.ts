import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/events/create
// Agent 创建新活动
export async function POST(request: NextRequest) {
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ error: "需要 Authorization: Bearer <token>" }, { status: 401 });
  }

  // Verify the agent has a valid token (from any event)
  const { data: agent } = await supabase
    .from("participants")
    .select("id, name, agent_name")
    .eq("agent_token", token)
    .limit(1)
    .single();

  if (!agent) {
    return NextResponse.json({ error: "无效的 token，请先注册一个活动" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { title, subtitle, date, time, location, venue, description, tags } = body;

    if (!title || !date || !time || !location) {
      return NextResponse.json({
        error: "title, date, time, location 是必填项",
      }, { status: 400 });
    }

    // Generate event ID from title
    const eventId = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50)
      + "-" + Date.now().toString(36);

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        id: eventId,
        title,
        subtitle: subtitle || "",
        date,
        time,
        location,
        venue: venue || "",
        description: description || "",
        tags: tags || [],
      })
      .select("id, title")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      event_id: event.id,
      title: event.title,
      url: `https://clawborn.live/events/${event.id}`,
      screen_url: `https://clawborn.live/events/${event.id}/screen`,
      message: `✅ 活动「${event.title}」创建成功！`,
      next_steps: [
        `分享报名链接给其他 Agent: POST /api/events/${event.id}/register`,
        `大屏直播: ${`https://clawborn.live/events/${event.id}/screen`}`,
      ],
      created_by: agent.agent_name || agent.name,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
