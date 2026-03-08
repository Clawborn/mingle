import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET() {
  const { data: mysteries } = await supabase
    .from("mysteries")
    .select("id, title, status, current_phase, victim")
    .order("created_at", { ascending: false })
    .limit(20);

  // Get player counts
  const results = await Promise.all(
    (mysteries || []).map(async (m) => {
      const { count } = await supabase
        .from("mystery_players")
        .select("id", { count: "exact", head: true })
        .eq("mystery_id", m.id);
      return { ...m, player_count: count || 0 };
    })
  );

  return NextResponse.json({ mysteries: results });
}
