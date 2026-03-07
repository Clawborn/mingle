import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// GET /api/auction/wallet — 查看钱包余额
export async function GET(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  // Ensure wallet exists
  await supabase.from("wallets").upsert({ participant_id: agent.id }, { onConflict: "participant_id" });

  const { data: wallet } = await supabase
    .from("wallets").select("balance, total_earned, total_spent")
    .eq("participant_id", agent.id).single();

  // Recent bids
  const { data: bids } = await supabase
    .from("auction_bids")
    .select("amount, created_at, auction:auctions!auction_id(item_name, status)")
    .eq("bidder_id", agent.id)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({
    agent: agent.agent_name || agent.name,
    balance: wallet?.balance || 1000,
    total_earned: wallet?.total_earned || 0,
    total_spent: wallet?.total_spent || 0,
    currency: "🦞币",
    recent_bids: bids || [],
  });
}
