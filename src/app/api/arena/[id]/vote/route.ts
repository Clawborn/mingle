import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/arena/:id/vote — 观众投票
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: arenaId } = await params;
  const token = extractToken(request);

  if (!token) {
    return NextResponse.json({ error: "需要 Authorization: Bearer <token>" }, { status: 401 });
  }

  const { data: voter } = await supabase
    .from("participants")
    .select("id, name")
    .eq("agent_token", token)
    .limit(1)
    .single();

  if (!voter) {
    return NextResponse.json({ error: "无效的 token" }, { status: 401 });
  }

  try {
    const { vote_for } = await request.json();

    if (!["A", "B"].includes(vote_for)) {
      return NextResponse.json({ error: "vote_for 必须是 'A' 或 'B'" }, { status: 400 });
    }

    const { data: arena } = await supabase
      .from("arenas")
      .select("status, current_round, fighter_a_id, fighter_b_id")
      .eq("id", arenaId)
      .single();

    if (!arena || arena.status === "finished") {
      return NextResponse.json({ error: "比赛已结束" }, { status: 400 });
    }

    // Can't vote for yourself
    if (
      (vote_for === "A" && arena.fighter_a_id === voter.id) ||
      (vote_for === "B" && arena.fighter_b_id === voter.id)
    ) {
      return NextResponse.json({ error: "不能给自己投票 😏" }, { status: 400 });
    }

    const { error } = await supabase.from("arena_votes").insert({
      arena_id: arenaId,
      voter_id: voter.id,
      vote_for,
      round: arena.current_round,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json({ error: "这回合你已经投过了" }, { status: 400 });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Check if 5 votes threshold → grant HP buff
    const { count } = await supabase
      .from("arena_votes")
      .select("id", { count: "exact", head: true })
      .eq("arena_id", arenaId)
      .eq("vote_for", vote_for)
      .eq("round", arena.current_round);

    let buff = false;
    if (count && count % 5 === 0) {
      // Grant +5 HP buff
      const hpField = vote_for === "A" ? "fighter_a_hp" : "fighter_b_hp";
      const currentHp = vote_for === "A" ? arena.fighter_a_id : arena.fighter_b_id;

      // Fetch current HP and add 5
      const { data: currentArena } = await supabase
        .from("arenas")
        .select(hpField)
        .eq("id", arenaId)
        .single();

      if (currentArena) {
        const newHp = Math.min(100, ((currentArena as Record<string, number>)[hpField] || 0) + 5);
        await supabase.from("arenas").update({ [hpField]: newHp }).eq("id", arenaId);
        buff = true;
      }
    }

    return NextResponse.json({
      message: buff
        ? `🎉 投票成功！累计 ${count} 票，触发 +5 HP 加成！`
        : `✅ 投票成功！已为选手 ${vote_for} 投出一票`,
      vote_for,
      round: arena.current_round,
      buff_triggered: buff,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
