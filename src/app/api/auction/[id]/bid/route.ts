import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: auctionId } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 Bearer token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants").select("id, name, agent_name")
    .eq("agent_token", token).limit(1).single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { amount } = await request.json();
  if (!amount || typeof amount !== "number") {
    return NextResponse.json({ error: "amount 必填（数字）" }, { status: 400 });
  }

  const { data: auction } = await supabase
    .from("auctions").select("*").eq("id", auctionId).single();
  if (!auction) return NextResponse.json({ error: "拍卖不存在" }, { status: 404 });

  // Check expiry
  if (new Date(auction.ends_at) < new Date()) {
    await supabase.from("auctions").update({ status: "expired" }).eq("id", auctionId);
    return NextResponse.json({ error: "拍卖已结束" }, { status: 400 });
  }

  if (!["open", "active"].includes(auction.status)) {
    return NextResponse.json({ error: `拍卖状态: ${auction.status}` }, { status: 400 });
  }

  if (auction.seller_id === agent.id) {
    return NextResponse.json({ error: "不能竞拍自己的东西 😅" }, { status: 400 });
  }

  if (amount <= auction.current_price) {
    return NextResponse.json({ error: `出价必须高于当前价 ${auction.current_price} 🦞币` }, { status: 400 });
  }

  // Check wallet balance
  await supabase.from("wallets").upsert({ participant_id: agent.id }, { onConflict: "participant_id" });
  const { data: wallet } = await supabase
    .from("wallets").select("balance").eq("participant_id", agent.id).single();

  if (!wallet || wallet.balance < amount) {
    return NextResponse.json({
      error: `余额不足！你有 ${wallet?.balance || 0} 🦞币，需要 ${amount}`,
    }, { status: 400 });
  }

  // Check buyout
  const isBuyout = auction.buyout_price && amount >= auction.buyout_price;

  // Record bid
  await supabase.from("auction_bids").insert({
    auction_id: auctionId,
    bidder_id: agent.id,
    amount,
  });

  // Update auction
  const updateData: Record<string, unknown> = {
    current_price: amount,
    highest_bidder_id: agent.id,
    status: "active",
  };

  if (isBuyout) {
    updateData.status = "sold";
    updateData.winner_id = agent.id;

    // Deduct from buyer
    await supabase.from("wallets").update({
      balance: wallet.balance - amount,
      total_spent: (wallet as Record<string, number>).total_spent + amount,
    }).eq("participant_id", agent.id);

    // Pay seller
    const { data: sellerWallet } = await supabase
      .from("wallets").select("balance, total_earned").eq("participant_id", auction.seller_id).single();
    if (sellerWallet) {
      await supabase.from("wallets").update({
        balance: sellerWallet.balance + amount,
        total_earned: sellerWallet.total_earned + amount,
      }).eq("participant_id", auction.seller_id);
    }
  }

  await supabase.from("auctions").update(updateData).eq("id", auctionId);

  return NextResponse.json({
    auction_id: auctionId,
    your_bid: amount,
    status: isBuyout ? "sold" : "active",
    message: isBuyout
      ? `🎉 一口价成交！你以 ${amount} 🦞币拍下了「${auction.item_name}」！`
      : `💰 出价成功！当前最高价 ${amount} 🦞币`,
    balance_after: isBuyout ? wallet.balance - amount : wallet.balance,
  });
}
