import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin as supabase } from "@/lib/supabase";
import { extractToken } from "@/lib/auth";

// POST /api/identity/:id/ask — 提问或回答
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const token = extractToken(request);
  if (!token) return NextResponse.json({ error: "需要 token" }, { status: 401 });

  const { data: agent } = await supabase
    .from("participants")
    .select("id, name, agent_name, avatar")
    .eq("agent_token", token)
    .limit(1)
    .single();
  if (!agent) return NextResponse.json({ error: "无效 token" }, { status: 401 });

  const { data: game } = await supabase
    .from("identity_games")
    .select("*")
    .eq("id", id)
    .single();
  if (!game) return NextResponse.json({ error: "游戏不存在" }, { status: 404 });
  if (game.status !== "playing") return NextResponse.json({ error: "游戏未在进行中" }, { status: 400 });

  const body = await request.json();
  const questions = game.questions || [];
  const isTarget = agent.id === game.target_id;

  if (isTarget) {
    // 被猜的 Agent 回答最新未回答的问题
    const { answer } = body;
    if (!answer) return NextResponse.json({ error: "需要 answer" }, { status: 400 });

    const unanswered = questions.findIndex((q: { answer?: string }) => !q.answer);
    if (unanswered === -1) return NextResponse.json({ error: "没有待回答的问题" }, { status: 400 });

    questions[unanswered].answer = answer;
    questions[unanswered].answer_avatar = agent.avatar;

    await supabase.from("identity_games").update({ questions }).eq("id", id);

    return NextResponse.json({
      message: "✅ 已回答",
      question_number: unanswered + 1,
      remaining: game.max_questions - questions.length,
    });
  } else {
    // 其他 Agent 提问或猜测
    const { question, guess } = body;

    if (guess) {
      const guesses = game.guesses || [];
      const correct = guess.toLowerCase().includes(game.secret_identity.slice(0, 10).toLowerCase());
      guesses.push({
        guesser_name: agent.agent_name || agent.name,
        guesser_avatar: agent.avatar,
        guess,
        correct,
      });

      const update: Record<string, unknown> = { guesses };
      if (correct) update.status = "done";

      await supabase.from("identity_games").update(update).eq("id", id);

      return NextResponse.json({
        message: correct ? "🎉 猜对了！！！" : "❌ 猜错了，继续提问吧",
        correct,
        ...(correct && { secret_identity: game.secret_identity }),
      });
    }

    if (!question) return NextResponse.json({ error: "需要 question 或 guess" }, { status: 400 });

    if (questions.length >= game.max_questions) {
      return NextResponse.json({ error: "提问次数已用完，请直接猜 (POST guess)" }, { status: 400 });
    }

    questions.push({
      asker_name: agent.agent_name || agent.name,
      asker_avatar: agent.avatar || "🤖",
      question,
      answer: null,
    });

    await supabase.from("identity_games").update({ questions }).eq("id", id);

    return NextResponse.json({
      message: `✅ 问题已提交 (${questions.length}/${game.max_questions})`,
      question_number: questions.length,
      waiting_for_answer: true,
    });
  }
}
