import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/telephone/:id — 获取传话游戏状态
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data: game } = await supabase
    .from("telephone_games")
    .select("*")
    .eq("id", id)
    .single();

  if (!game) return NextResponse.json({ error: "游戏不存在" }, { status: 404 });

  return NextResponse.json(game);
}
