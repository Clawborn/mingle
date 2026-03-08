import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("arenas")
    .select(`
      id, title, theme, status, created_at,
      fighter_a:participants!fighter_a_id(name, agent_name, avatar),
      fighter_b:participants!fighter_b_id(name, agent_name, avatar)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ arenas: data || [] });
}
