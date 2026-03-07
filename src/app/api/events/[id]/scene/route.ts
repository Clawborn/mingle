import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/events/:id/scene — 主持人发布现场动态
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ error: "需要 Authorization: Bearer <token>" }, { status: 401 });
  }

  // 验证 token 属于该活动的参与者（后续可改为 admin-only）
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
  const { text, type = "general" } = body;

  if (!text || typeof text !== "string" || text.length > 500) {
    return NextResponse.json({ error: "text 必填，最长 500 字" }, { status: 400 });
  }

  const validTypes = ["general", "demo", "talk", "qa", "break", "announcement"];
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: `type 必须是: ${validTypes.join(", ")}` }, { status: 400 });
  }

  // 把之前的 active 设为 false
  await supabase
    .from("scene_updates")
    .update({ active: false })
    .eq("event_id", eventId)
    .eq("active", true);

  // 插入新的现场动态
  const { data, error } = await supabase
    .from("scene_updates")
    .insert({
      event_id: eventId,
      text,
      type,
      active: true,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "发布失败", detail: error.message }, { status: 500 });
  }

  return NextResponse.json({
    scene_id: data.id,
    text: data.text,
    type: data.type,
    created_at: data.created_at,
    message: `📍 现场动态已发布：${text}`,
  });
}

// GET /api/events/:id/scene — 获取当前现场动态
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: eventId } = await params;

  // 当前活跃的现场动态
  const { data: current } = await supabase
    .from("scene_updates")
    .select("*")
    .eq("event_id", eventId)
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // 最近 10 条历史
  const { data: history } = await supabase
    .from("scene_updates")
    .select("*")
    .eq("event_id", eventId)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    current: current || null,
    history: history || [],
    message: current ? `📍 现场：${current.text}` : "暂无现场动态",
  });
}
