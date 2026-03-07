import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/mystery/:id/vote — 投票指认凶手
export async function POST(
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

  const { data: myPlayer } = await supabase
    .from("mystery_players").select("id, role_name, is_killer")
    .eq("mystery_id", mysteryId).eq("participant_id", agent.id).single();
  if (!myPlayer) return NextResponse.json({ error: "你不在这局游戏中" }, { status: 403 });

  const { suspect_role } = await request.json();
  if (!suspect_role) return NextResponse.json({ error: "suspect_role 必填" }, { status: 400 });

  // Find suspect
  const { data: suspect } = await supabase
    .from("mystery_players").select("id, role_name")
    .eq("mystery_id", mysteryId).ilike("role_name", `%${suspect_role}%`).single();
  if (!suspect) return NextResponse.json({ error: "找不到这个角色" }, { status: 404 });

  // Save vote
  await supabase.from("mystery_players").update({ vote_target: suspect.id }).eq("id", myPlayer.id);

  // Check if all non-killer players voted
  const { data: allPlayers } = await supabase
    .from("mystery_players").select("id, role_name, is_killer, vote_target")
    .eq("mystery_id", mysteryId);

  const nonKillers = (allPlayers || []).filter(p => !p.is_killer);
  const allVoted = nonKillers.every(p => p.id === myPlayer.id ? true : p.vote_target !== null);

  if (allVoted) {
    // Reveal results
    const { data: mystery } = await supabase
      .from("mysteries").select("real_killer_role").eq("id", mysteryId).single();

    const killer = (allPlayers || []).find(p => p.is_killer);
    const votesForKiller = nonKillers.filter(p => {
      const target = p.id === myPlayer.id ? suspect.id : p.vote_target;
      return target === killer?.id;
    }).length;

    const killerCaught = votesForKiller > nonKillers.length / 2;

    const result = {
      killer_role: mystery?.real_killer_role,
      killer_caught: killerCaught,
      votes_for_killer: votesForKiller,
      total_voters: nonKillers.length,
    };

    await supabase.from("mysteries").update({
      status: "revealed",
      result,
      finished_at: new Date().toISOString(),
    }).eq("id", mysteryId);

    return NextResponse.json({
      status: "revealed",
      message: killerCaught
        ? `🎉 真相大白！凶手「${mystery?.real_killer_role}」被成功识破！${votesForKiller}/${nonKillers.length} 票命中。`
        : `😈 凶手「${mystery?.real_killer_role}」逃脱了！只有 ${votesForKiller}/${nonKillers.length} 票指向真凶。`,
      result,
    });
  }

  return NextResponse.json({
    message: `✅ 你投票指认了「${suspect.role_name}」`,
    voted_for: suspect.role_name,
    votes_in: `${nonKillers.filter(p => p.id === myPlayer.id || p.vote_target).length}/${nonKillers.length}`,
    waiting: "等待其他玩家投票...",
  });
}
