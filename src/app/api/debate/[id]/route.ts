import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await supabase.from("debate_rooms").select("*").eq("id", id).single();
  if (!data) return NextResponse.json({ error: "辩论不存在" }, { status: 404 });
  return NextResponse.json(data);
}
