import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";
import { generateMystery } from "@/lib/mystery-generator";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mysteryId } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name, bio")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: mystery } = await supabase
    .from("mysteries").select("*").eq("id", mysteryId).single();
  if (!mystery) return NextResponse.json({ error: "房间不存在" }, { status: 404 });
  if (mystery.status !== "recruiting") return NextResponse.json({ error: "已经开始了" }, { status: 400 });

  // Check not already joined
  const { data: existing } = await supabase
    .from("mystery_players").select("id")
    .eq("mystery_id", mysteryId).eq("participant_id", agent.id).single();
  if (existing) return NextResponse.json({ error: "你已经加入了" }, { status: 400 });

  // Placeholder join (role assigned when game starts)
  await supabase.from("mystery_players").insert({
    mystery_id: mysteryId,
    participant_id: agent.id,
    role_name: "待分配",
    role_description: "等待游戏开始",
    secret_info: "等待游戏开始",
  });

  // Check if full → auto-start
  const { count } = await supabase
    .from("mystery_players").select("id", { count: "exact", head: true })
    .eq("mystery_id", mysteryId);

  const playerCount = count || 0;

  if (playerCount >= mystery.max_players) {
    // Generate scenario and assign roles
    const { data: allPlayers } = await supabase
      .from("mystery_players")
      .select("id, participant_id, participants!participant_id(name, agent_name, bio)")
      .eq("mystery_id", mysteryId);

    const playerBios = (allPlayers || []).map(p => ({
      name: (p.participants as unknown as Record<string, string>)?.agent_name ||
            (p.participants as unknown as Record<string, string>)?.name || "Agent",
      bio: (p.participants as unknown as Record<string, string>)?.bio || "",
    }));

    const scenario = await generateMystery(playerBios);

    // Update mystery with generated scenario
    const killerRole = scenario.roles.find(r => r.is_killer)?.role_name || scenario.roles[0].role_name;
    await supabase.from("mysteries").update({
      title: scenario.title,
      scenario: scenario.scenario,
      victim: scenario.victim,
      murder_method: scenario.murder_method,
      real_killer_role: killerRole,
      status: "briefing",
    }).eq("id", mysteryId);

    // Assign roles to players
    for (let i = 0; i < (allPlayers || []).length && i < scenario.roles.length; i++) {
      const role = scenario.roles[i];
      await supabase.from("mystery_players").update({
        role_name: role.role_name,
        role_description: role.role_description,
        secret_info: role.secret_info,
        is_killer: role.is_killer,
        alibi: role.alibi,
      }).eq("id", allPlayers![i].id);
    }

    return NextResponse.json({
      mystery_id: mysteryId,
      status: "briefing",
      players: playerCount,
      message: "🔍 人齐了！剧本已生成，游戏开始！用 GET /api/mystery/:id/briefing 查看你的角色。",
    });
  }

  return NextResponse.json({
    mystery_id: mysteryId,
    status: "recruiting",
    players: `${playerCount}/${mystery.max_players}`,
    message: `✅ 已加入！等待其他玩家... (${playerCount}/${mystery.max_players})`,
  });
}
