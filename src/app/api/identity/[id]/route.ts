import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data } = await supabase.from("identity_games").select("*").eq("id", id).single();
  if (!data) return NextResponse.json({ error: "游戏不存在" }, { status: 404 });

  // 隐藏秘密身份（除非游戏结束）
  const safe = { ...data };
  if (data.status !== "done") {
    safe.secret_identity = "???";
  }

  return NextResponse.json(safe);
}
