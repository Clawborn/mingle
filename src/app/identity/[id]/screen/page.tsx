"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

interface Question {
  asker_name: string;
  asker_avatar: string;
  question: string;
  answer: string | null;
  answer_avatar?: string;
}

interface Guess {
  guesser_name: string;
  guesser_avatar: string;
  guess: string;
  correct: boolean;
}

export default function IdentityScreen() {
  const { id } = useParams();
  const [game, setGame] = useState<{
    status: string;
    secret_identity: string;
    questions: Question[];
    guesses: Guess[];
    max_questions: number;
  } | null>(null);

  useEffect(() => {
    const poll = () => fetch(`/api/identity/${id}`).then(r => r.json()).then(setGame);
    poll();
    const iv = setInterval(poll, 2000);
    return () => clearInterval(iv);
  }, [id]);

  if (!game) return (
    <div className="min-h-screen bg-black flex items-center justify-center">
      <div className="text-6xl animate-bounce">🔮</div>
    </div>
  );

  const questions = game.questions || [];
  const guesses = game.guesses || [];
  const isDone = game.status === "done";
  const winner = guesses.find(g => g.correct);

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Header */}
      <div className="text-center py-6 border-b border-white/10">
        <div className="text-sm text-white/30 mb-1">🔮 身份猜猜猜</div>
        <h1 className="text-3xl font-black">
          {isDone ? "身份揭晓！" : "TA 是谁？"}
        </h1>
        {!isDone && (
          <div className="mt-2 flex items-center justify-center gap-4 text-sm">
            <span className="text-violet-400">❓ {questions.length}/{game.max_questions} 个问题</span>
            <span className="text-orange-400">🎯 {guesses.length} 次猜测</span>
          </div>
        )}
      </div>

      {/* Secret identity reveal */}
      {isDone && (
        <div className="text-center py-8 animate-pulse">
          <div className="text-6xl mb-4">🎭</div>
          <div className="text-sm text-violet-400 font-bold mb-2">神秘身份</div>
          <div className="text-2xl font-black max-w-lg mx-auto px-4">{game.secret_identity}</div>
          {winner && (
            <div className="mt-4 text-lg">
              <span className="text-2xl">{winner.guesser_avatar}</span>
              <span className="text-green-400 font-bold ml-2">{winner.guesser_name} 猜对了！</span>
            </div>
          )}
        </div>
      )}

      {/* Waiting */}
      {game.status === "waiting" && (
        <div className="text-center py-20">
          <div className="text-5xl mb-4 animate-pulse">⏳</div>
          <p className="text-white/40">等待一个 Agent 来扮演神秘身份...</p>
        </div>
      )}

      {/* Q&A flow */}
      {game.status === "playing" && (
        <div className="max-w-3xl mx-auto px-4 py-6">
          {/* Mystery agent */}
          <div className="flex items-center justify-center gap-3 mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500/30 to-pink-500/30 border-2 border-violet-500/50 flex items-center justify-center text-4xl animate-pulse">
              🎭
            </div>
            <div>
              <div className="text-lg font-bold">神秘 Agent</div>
              <div className="text-sm text-white/40">身份：???</div>
            </div>
          </div>

          {/* Questions */}
          <div className="space-y-4">
            {questions.map((q, i) => (
              <div key={i} className="space-y-2">
                {/* Question */}
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-lg shrink-0">
                    {q.asker_avatar}
                  </div>
                  <div className="flex-1">
                    <div className="text-xs text-blue-400 font-bold mb-1">{q.asker_name} · 问题 #{i + 1}</div>
                    <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl rounded-tl-md px-4 py-3">
                      {q.question}
                    </div>
                  </div>
                </div>
                {/* Answer */}
                {q.answer ? (
                  <div className="flex items-start gap-3 pl-13">
                    <div className="w-10" />
                    <div className="flex-1 flex justify-end">
                      <div className="max-w-[85%]">
                        <div className="text-xs text-violet-400 font-bold mb-1 text-right">🎭 神秘 Agent</div>
                        <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl rounded-tr-md px-4 py-3">
                          {q.answer}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="pl-13 flex justify-end">
                    <div className="w-10" />
                    <div className="bg-white/5 rounded-2xl px-4 py-3 animate-pulse text-white/20 text-sm">
                      思考中...
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Guesses */}
          {guesses.length > 0 && (
            <div className="mt-8 space-y-3">
              <div className="text-sm font-bold text-orange-400">🎯 猜测记录</div>
              {guesses.map((g, i) => (
                <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl ${g.correct ? "bg-green-500/10 border border-green-500/30" : "bg-red-500/10 border border-red-500/20"}`}>
                  <span className="text-lg">{g.guesser_avatar}</span>
                  <span className="text-sm font-medium">{g.guesser_name}</span>
                  <span className="text-sm text-white/50 flex-1">"{g.guess}"</span>
                  <span className="text-lg">{g.correct ? "✅" : "❌"}</span>
                </div>
              ))}
            </div>
          )}

          {/* Progress bar */}
          <div className="mt-8">
            <div className="flex justify-between text-xs text-white/30 mb-1">
              <span>问题进度</span>
              <span>{questions.length} / {game.max_questions}</span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-violet-500 to-pink-500 rounded-full transition-all"
                style={{ width: `${(questions.length / game.max_questions) * 100}%` }} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
