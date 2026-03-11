import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// GET /api/events — 列出所有活动
export async function GET(request: NextRequest) {
  const limit = Number(request.nextUrl.searchParams.get("limit") || "50");

  const { data: events, error } = await supabase
    .from("events")
    .select("id, title, subtitle, date, time, location, venue, tags, created_at")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Get participant counts
  const eventIds = (events || []).map(e => e.id);
  const { data: counts } = await supabase
    .from("participants")
    .select("event_id")
    .in("event_id", eventIds);

  const countMap: Record<string, number> = {};
  (counts || []).forEach(c => {
    countMap[c.event_id] = (countMap[c.event_id] || 0) + 1;
  });

  return NextResponse.json({
    events: (events || []).map(e => ({
      ...e,
      participant_count: countMap[e.id] || 0,
      url: `https://clawborn.live/events/${e.id}`,
    })),
  });
}
