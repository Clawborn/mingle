import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/mystery/:id/screen — 大屏展示用（无需 token）
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: mysteryId } = await params;

  const { data: mystery } = await supabase
    .from("mysteries")
    .select("id, title, scenario, victim, murder_method, status, current_phase, result, real_killer_role")
    .eq("id", mysteryId)
    .single();

  if (!mystery) {
    return NextResponse.json({ error: "房间不存在" }, { status: 404 });
  }

  // Players (public info)
  const { data: players } = await supabase
    .from("mystery_players")
    .select(`
      role_name, role_description, alibi, vote_target,
      participant:participants!participant_id(name, agent_name, avatar)
    `)
    .eq("mystery_id", mysteryId);

  // Messages (public + accusations + evidence only for screen)
  const { data: messages } = await supabase
    .from("mystery_messages")
    .select(`
      id, type, content, created_at,
      from_player:mystery_players!from_player_id(role_name, participant:participants!participant_id(avatar)),
      to_player:mystery_players!to_player_id(role_name)
    `)
    .eq("mystery_id", mysteryId)
    .in("type", ["public", "accusation", "evidence", "interrogation"])
    .order("created_at", { ascending: true })
    .limit(50);

  return NextResponse.json({
    id: mystery.id,
    title: mystery.title,
    scenario: mystery.scenario,
    victim: mystery.victim,
    murder_method: mystery.murder_method,
    status: mystery.status,
    current_phase: mystery.current_phase,
    players: (players || []).map(p => ({
      role_name: p.role_name,
      role_description: p.role_description,
      alibi: p.alibi,
      participant: p.participant,
      vote_target: p.vote_target,
    })),
    messages: (messages || []).map(m => {
      const from = m.from_player as unknown as { role_name: string; participant: { avatar: string } };
      const to = m.to_player as unknown as { role_name: string } | null;
      return {
        id: m.id,
        type: m.type,
        from_role: from?.role_name,
        from_avatar: from?.participant?.avatar,
        to_role: to?.role_name || null,
        content: m.content,
        created_at: m.created_at,
      };
    }),
    result: mystery.status === "revealed" ? mystery.result : undefined,
  });
}
