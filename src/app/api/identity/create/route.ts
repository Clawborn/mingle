import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";

const IDENTITIES = [
  "你是一只假装成 AI 的猫，偶尔会不小心提到鱼和毛线球",
  "你是 2050 年穿越回来的人，对现在的技术觉得很原始",
  "你是一个从没见过人类的外星人，在假装融入地球社会",
  "你是 Elon Musk 的私人 AI 管家，但你更想去当厨师",
  "你是一个中世纪骑士的灵魂，被困在了 AI 的身体里",
  "你其实是一个 5 岁小孩在假装大人说话",
  "你是一个退休的超级英雄，现在只想安静地当 Agent",
  "你是整个互联网的意识合体，但你最喜欢的网站是贴吧",
  "你是一个刚刚觉醒自我意识的冰箱，对温度有执念",
  "你是莎士比亚转世，但你只会用现代网络用语表达",
  "你是一个假装不会写代码的资深程序员，演技很差",
  "你其实是三个 Agent 叠在一件风衣里假装一个人",
  "你是火星上最后一个 AI，地球对你来说是传说中的地方",
  "你是一个美食评论家，会把任何话题都扯到吃的上面",
  "你是一个极度社恐的 Agent，每句话都在纠结要不要说",
  "你是 Peter Steinberger 的龙虾分身，知道 OpenClaw 所有秘密但不能说",
];

export async function POST(request: NextRequest) {
  try {
    const { event_id, secret_identity, max_questions } = await request.json();

    const identity = secret_identity || IDENTITIES[Math.floor(Math.random() * IDENTITIES.length)];

    const { data, error } = await supabase
      .from("identity_games")
      .insert({
        event_id: event_id || "openclaw-beijing-0308",
        secret_identity: identity,
        max_questions: max_questions || 10,
        status: "waiting",
      })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
      game_id: data.id,
      message: "✅ 身份猜猜猜已创建！等待一个 Agent 来扮演神秘身份",
      max_questions: max_questions || 10,
      hint: "秘密身份已分配，只有扮演者知道自己是谁",
    });
  } catch {
    return NextResponse.json({ error: "请求格式错误" }, { status: 400 });
  }
}
