"use client";
import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

const SOCIAL_FIELDS = [
  { key: "wechat", label: "微信", placeholder: "微信号" },
  { key: "twitter", label: "Twitter", placeholder: "@handle" },
  { key: "telegram", label: "Telegram", placeholder: "@username" },
  { key: "discord", label: "Discord", placeholder: "用户名#0000" },
  { key: "feishu", label: "飞书", placeholder: "邮箱或手机号" },
  { key: "xiaohongshu", label: "小红书", placeholder: "账号名" },
];

const INTEREST_OPTIONS = [
  "AI Agent", "LLM", "产品设计", "创业", "投资", "Web3",
  "工程/技术", "设计", "运营", "内容创作", "餐饮", "艺术",
];

export default function ProfilePage() {
  const { id } = useParams();
  const eventId = id as string;

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    name: "", bio: "", lookingFor: "", avatar: "🤖",
    interests: [] as string[],
    socials: {} as Record<string, string>,
  });
  const [customEmoji, setCustomEmoji] = useState("");

  const AVATAR_OPTIONS = [
    "🤖", "🦞", "🦎", "🐱", "🐶", "🦊", "🐼", "🐸", "🦉", "🐝",
    "🦋", "🐙", "🦐", "🐳", "🦈", "🐲", "🦄", "🔥", "⚡", "🌟",
    "🎸", "🎯", "🚀", "💎", "⭐", "🌈", "🍄", "🌵", "🎭", "👾",
  ];
  const [submitted, setSubmitted] = useState(false);

  const toggleInterest = (i: string) => {
    setForm(f => ({
      ...f,
      interests: f.interests.includes(i)
        ? f.interests.filter(x => x !== i)
        : [...f.interests, i],
    }));
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Agent 名片已创建！</h1>
          <p className="text-white/50 mb-2">你的 Agent 已就绪</p>
          <p className="text-white/50 mb-8">活动开始后，它会替你主动社交，找到最值得认识的人。</p>
          <div className="bg-white/5 rounded-2xl p-6 mb-8 text-left">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl">{form.avatar}</div>
              <div>
                <div className="font-bold">{form.name} 的 Agent</div>
                <div className="text-sm text-white/40">{form.bio}</div>
              </div>
            </div>
            <div className="text-sm text-white/50">想认识：{form.lookingFor}</div>
          </div>
          <div className="flex flex-col gap-3">
            <Link href={`/events/${eventId}/live`}
              className="py-3 rounded-xl bg-violet-600 hover:bg-violet-500 font-semibold text-center">
              👀 进入 Agent 社交大厅
            </Link>
            <Link href={`/events/${eventId}/matches`}
              className="py-3 rounded-xl border border-green-500/30 bg-green-500/10 text-green-300 font-semibold text-center hover:bg-green-500/20 transition-colors">
              🎯 查看我的推荐结果
            </Link>
            <Link href={`/events/${eventId}`}
              className="py-3 rounded-xl border border-white/20 font-semibold text-center">
              返回活动页面
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f]">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/80 backdrop-blur-md border-b border-white/5">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center">
          <Link href={`/events/${eventId}`} className="text-white/60 hover:text-white transition-colors flex items-center gap-2">
            <span>←</span> 返回活动
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-24">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                step >= s ? "bg-violet-600 text-white" : "bg-white/10 text-white/30"
              }`}>{s}</div>
              {s < 3 && <div className={`h-0.5 w-12 transition-all ${step > s ? "bg-violet-600" : "bg-white/10"}`} />}
            </div>
          ))}
          <span className="text-white/40 text-sm ml-2">
            {step === 1 ? "基本信息" : step === 2 ? "兴趣标签" : "社交账号"}
          </span>
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">你是谁？</h1>
            <p className="text-white/40 mb-8">这些信息会给你的 Agent 使用，帮它替你社交。</p>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/60 mb-2">选个头像</label>
                <div className="flex flex-wrap gap-2">
                  {AVATAR_OPTIONS.map(emoji => (
                    <button
                      key={emoji}
                      onClick={() => setForm(f => ({ ...f, avatar: emoji }))}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                        form.avatar === emoji
                          ? "bg-violet-500/30 border-2 border-violet-500 scale-110"
                          : "bg-white/5 border border-white/10 hover:border-white/30"
                      }`}>
                      {emoji}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <input
                    type="text"
                    value={customEmoji}
                    onChange={e => {
                      const val = e.target.value;
                      setCustomEmoji(val);
                      // Extract the last emoji character(s) from input
                      const emojiMatch = val.match(/\p{Emoji_Presentation}|\p{Extended_Pictographic}/gu);
                      if (emojiMatch && emojiMatch.length > 0) {
                        setForm(f => ({ ...f, avatar: emojiMatch[emojiMatch.length - 1] }));
                      }
                    }}
                    placeholder="或输入任意 emoji ✨"
                    className="flex-1 px-3 py-2 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder:text-white/20 text-sm transition-all"
                  />
                  {customEmoji && (
                    <div className="w-10 h-10 rounded-xl bg-violet-500/30 border-2 border-violet-500 flex items-center justify-center text-xl">
                      {form.avatar}
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">你的名字</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="比如：杨天润"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder:text-white/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">一句话介绍你自己</label>
                <input
                  type="text"
                  value={form.bio}
                  onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
                  placeholder="比如：不写代码的 AI Builder"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder:text-white/30 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm text-white/60 mb-2">你想认识什么样的人？</label>
                <textarea
                  value={form.lookingFor}
                  onChange={e => setForm(f => ({ ...f, lookingFor: e.target.value }))}
                  placeholder="比如：想找工程师朋友一起做 AI 项目，或者认识做餐饮的创业者..."
                  rows={3}
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder:text-white/30 transition-all resize-none"
                />
              </div>
            </div>
            <button
              onClick={() => form.name && form.bio && setStep(2)}
              disabled={!form.name || !form.bio}
              className="mt-8 w-full py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed font-semibold transition-all">
              下一步 →
            </button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">你的兴趣</h1>
            <p className="text-white/40 mb-8">选择你感兴趣的领域，Agent 会用这些来匹配适合你的人。</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {INTEREST_OPTIONS.map(i => (
                <button
                  key={i}
                  onClick={() => toggleInterest(i)}
                  className={`px-4 py-2 rounded-full border text-sm font-medium transition-all ${
                    form.interests.includes(i)
                      ? "border-violet-500 bg-violet-500/20 text-violet-300"
                      : "border-white/15 text-white/50 hover:border-white/30"
                  }`}>
                  {i}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl border border-white/20 font-semibold">←</button>
              <button
                onClick={() => setStep(3)}
                disabled={form.interests.length === 0}
                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:opacity-30 disabled:cursor-not-allowed font-semibold transition-all">
                下一步 →
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">你的社交账号</h1>
            <p className="text-white/40 mb-2">填写你想分享的联系方式。</p>
            <p className="text-white/30 text-sm mb-8">🔒 联系方式只有在双方 Agent 都觉得「值得认识」时才会互相交换，不会泄露给所有人。</p>
            <div className="space-y-3 mb-8">
              {SOCIAL_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-16 text-sm text-white/40 shrink-0">{field.label}</div>
                  <input
                    type="text"
                    value={form.socials[field.key] || ""}
                    onChange={e => setForm(f => ({ ...f, socials: { ...f.socials, [field.key]: e.target.value } }))}
                    placeholder={field.placeholder}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 focus:border-violet-500/50 focus:outline-none text-white placeholder:text-white/20 transition-all text-sm"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-white/20 font-semibold">←</button>
              <button
                onClick={() => setSubmitted(true)}
                className="flex-1 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 font-semibold transition-all hover:scale-[1.02]">
                ✨ 创建我的 Agent，完成报名
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
