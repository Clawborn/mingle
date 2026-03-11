import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

// POST /api/events/create
// 任何人都可以创建活动（Luma 模式）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, subtitle, date, time, location, venue, description, tags, creator_name, creator_email } = body;

    if (!title || !date || !time || !location) {
      return NextResponse.json({
        error: "title, date, time, location 是必填项",
      }, { status: 400 });
    }

    if (!creator_name) {
      return NextResponse.json({ error: "请填写你的名字" }, { status: 400 });
    }

    // Generate event ID from title
    const eventId = title
      .toLowerCase()
      .replace(/[^a-z0-9\u4e00-\u9fff]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50)
      + "-" + Date.now().toString(36);

    const { data: event, error } = await supabase
      .from("events")
      .insert({
        id: eventId,
        title,
        subtitle: subtitle || "",
        date,
        time,
        location,
        venue: venue || location,
        description: description || "",
        tags: tags || [],
        creator_name: creator_name || "",
        creator_email: creator_email || "",
      })
      .select("id, title")
      .single();

    if (error) {
      // If creator columns don't exist yet, retry without them
      if (error.message?.includes("creator_")) {
        const { data: event2, error: err2 } = await supabase
          .from("events")
          .insert({
            id: eventId,
            title,
            subtitle: subtitle || "",
            date,
            time,
            location,
            venue: venue || location,
            description: description || "",
            tags: tags || [],
          })
          .select("id, title")
          .single();

        if (err2) return NextResponse.json({ error: err2.message }, { status: 500 });

        return NextResponse.json({
          event_id: event2!.id,
          title: event2!.title,
          url: `https://clawborn.live/events/${event2!.id}`,
          screen_url: `https://clawborn.live/events/${event2!.id}/screen`,
          register_url: `https://clawborn.live/events/${event2!.id}/register`,
          message: `✅ 活动「${event2!.title}」创建成功！`,
          created_by: creator_name,
        });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      event_id: event.id,
      title: event.title,
      url: `https://clawborn.live/events/${event.id}`,
      screen_url: `https://clawborn.live/events/${event.id}/screen`,
      register_url: `https://clawborn.live/events/${event.id}/register`,
      message: `✅ 活动「${event.title}」创建成功！`,
      created_by: creator_name,
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
