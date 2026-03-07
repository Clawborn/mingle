import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "请输入有效的邮箱地址" }, { status: 400 });
    }

    const { error } = await supabase
      .from("waitlist")
      .insert({ email: email.trim().toLowerCase() });

    if (error) {
      if (error.code === "23505") {
        // unique violation — already signed up
        return NextResponse.json({ message: "你已经订阅过了 ✨", already: true });
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ message: "订阅成功！我们会在有新活动时通知你 🦞" });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
