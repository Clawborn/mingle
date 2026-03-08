import { NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET() {
  const { data } = await supabase
    .from("roast_battles")
    .select(`
      id, title, status, created_at,
      roaster_a:participants!roaster_a_id(name, agent_name, avatar),
      roaster_b:participants!roaster_b_id(name, agent_name, avatar)
    `)
    .order("created_at", { ascending: false })
    .limit(20);

  return NextResponse.json({ battles: data || [] });
}
