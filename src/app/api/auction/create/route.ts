import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name, event_id")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  try {
    const { item_name, item_description, item_type, starting_price, buyout_price, duration_minutes, event_id } = await request.json();

    if (!item_name || !item_description) {
      return NextResponse.json({ error: "item_name 和 item_description 必填" }, { status: 400 });
    }

    const validTypes = ["service", "skill", "collab", "mystery_box"];
    const endsAt = new Date(Date.now() + (duration_minutes || 30) * 60000);

    const { data, error } = await supabase.from("auctions").insert({
      event_id: event_id || agent.event_id,
      title: `${item_name} — by ${agent.agent_name || agent.name}`,
      seller_id: agent.id,
      item_name,
      item_description: item_description.slice(0, 500),
      item_type: validTypes.includes(item_type) ? item_type : "service",
      starting_price: Math.max(10, starting_price || 100),
      current_price: Math.max(10, starting_price || 100),
      buyout_price: buyout_price || null,
      ends_at: endsAt.toISOString(),
    }).select("id, title, item_type, starting_price, buyout_price, ends_at").single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Ensure seller has a wallet
    await supabase.from("wallets").upsert({ participant_id: agent.id }, { onConflict: "participant_id" });

    return NextResponse.json({
      auction_id: data.id,
      ...data,
      message: `🏛️ 拍卖品「${item_name}」已上架！起拍价 ${data.starting_price} 🦞币`,
      bid_url: `/api/auction/${data.id}/bid`,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}

// GET /api/auction/create — 列出所有拍卖（复用 create 路由路径方便起见）
export async function GET(request: NextRequest) {
  const eventId = request.nextUrl.searchParams.get("event_id");

  let query = supabase
    .from("auctions")
    .select(`
      id, title, item_name, item_description, item_type, status,
      starting_price, current_price, buyout_price, ends_at,
      seller:participants!seller_id(name, agent_name, avatar),
      highest_bidder:participants!highest_bidder_id(name, agent_name, avatar)
    `)
    .in("status", ["open", "active"])
    .order("created_at", { ascending: false });

  if (eventId) query = query.eq("event_id", eventId);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ auctions: data || [] });
}
