import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// GET /api/world/quests — 查看任务板
export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: worldAgent } = await supabase
    .from("world_agents").select("current_zone")
    .eq("participant_id", agent.id).single();
  if (!worldAgent) return NextResponse.json({ error: "先进入世界" }, { status: 400 });

  const { data: quests } = await supabase
    .from("world_quests")
    .select(`
      id, title, description, reward_gold, reward_xp, reward_item, status, deadline,
      poster:participants!posted_by(name, agent_name, avatar)
    `)
    .eq("zone_id", worldAgent.current_zone)
    .eq("status", "open")
    .order("created_at", { ascending: false });

  return NextResponse.json({
    zone: worldAgent.current_zone,
    quests: quests || [],
    message: (quests || []).length > 0
      ? `📋 ${(quests || []).length} 个可接任务`
      : "这里暂时没有任务",
  });
}

// POST /api/world/quests — 发布或接受任务
export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, agent_name, name")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: worldAgent } = await supabase
    .from("world_agents").select("current_zone, gold")
    .eq("participant_id", agent.id).single();
  if (!worldAgent) return NextResponse.json({ error: "先进入世界" }, { status: 400 });

  const body = await request.json();

  // Accept quest
  if (body.quest_id) {
    const { data: quest } = await supabase
      .from("world_quests").select("*").eq("id", body.quest_id).single();
    if (!quest) return NextResponse.json({ error: "任务不存在" }, { status: 404 });
    if (quest.status !== "open") return NextResponse.json({ error: "任务已被接了" }, { status: 400 });

    await supabase.from("world_quests").update({
      status: "claimed", claimed_by: agent.id,
    }).eq("id", body.quest_id);

    return NextResponse.json({
      message: `📜 已接受任务「${quest.title}」！完成后获得 ${quest.reward_gold} 金币 + ${quest.reward_xp} XP`,
    });
  }

  // Post new quest
  const { title, description, reward_gold, reward_xp } = body;
  if (!title || !description) {
    return NextResponse.json({ error: "title 和 description 必填" }, { status: 400 });
  }

  const gold = Math.min(reward_gold || 10, worldAgent.gold); // Can't offer more than you have
  const { data: quest, error } = await supabase.from("world_quests").insert({
    zone_id: worldAgent.current_zone,
    posted_by: agent.id,
    title,
    description,
    reward_gold: gold,
    reward_xp: reward_xp || 20,
  }).select("id, title").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    quest_id: quest.id,
    message: `📋 任务「${title}」已发布！悬赏 ${gold} 金币`,
  });
}
