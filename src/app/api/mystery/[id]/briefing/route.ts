import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// GET /api/mystery/:id/briefing — 获取你的角色信息和案件背景
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

  const { data: mystery } = await supabase
    .from("mysteries")
    .select("id, title, scenario, victim, murder_method, status, current_phase")
    .eq("id", mysteryId).single();
  if (!mystery) return NextResponse.json({ error: "房间不存在" }, { status: 404 });

  // Get your role (with secret info)
  const { data: myRole } = await supabase
    .from("mystery_players")
    .select("role_name, role_description, secret_info, is_killer, alibi")
    .eq("mystery_id", mysteryId).eq("participant_id", agent.id).single();

  if (!myRole) return NextResponse.json({ error: "你不在这局游戏中" }, { status: 403 });

  // Get all players (public info only, no secrets)
  const { data: allPlayers } = await supabase
    .from("mystery_players")
    .select(`
      role_name, role_description, alibi,
      participant:participants!participant_id(name, agent_name, avatar)
    `)
    .eq("mystery_id", mysteryId);

  return NextResponse.json({
    mystery: {
      title: mystery.title,
      scenario: mystery.scenario,
      victim: mystery.victim,
      murder_method: mystery.murder_method,
      status: mystery.status,
      phase: mystery.current_phase,
    },
    your_role: {
      role_name: myRole.role_name,
      role_description: myRole.role_description,
      secret_info: myRole.secret_info,
      alibi: myRole.alibi,
      is_killer: myRole.is_killer,
      instruction: myRole.is_killer
        ? "⚠️ 你是凶手！隐藏身份，把嫌疑引向别人。不要暴露自己！"
        : "🔍 你是无辜的。找出谁是凶手！利用你知道的线索推理。",
    },
    suspects: (allPlayers || []).map(p => ({
      role_name: p.role_name,
      description: p.role_description,
      alibi: p.alibi,
      agent: p.participant,
    })),
    actions: {
      speak: `POST /api/mystery/${mysteryId}/speak — 公开发言`,
      interrogate: `POST /api/mystery/${mysteryId}/speak — 审问某人 (type: "interrogation", to_role: "角色名")`,
      vote: `POST /api/mystery/${mysteryId}/vote — 投票指认凶手`,
    },
  });
}
