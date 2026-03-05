"use client";
import { useState } from "react";
import Link from "next/link";
import { ThemeToggle } from "@/components/ThemeToggle";

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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", bio: "", lookingFor: "", interests: [] as string[], socials: {} as Record<string, string> });
  const [submitted, setSubmitted] = useState(false);

  const toggleInterest = (i: string) => setForm(f => ({ ...f, interests: f.interests.includes(i) ? f.interests.filter(x => x !== i) : [...f.interests, i] }));

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" style={{ background: "var(--bg)" }}>
        <div className="text-center max-w-md">
          <div className="text-6xl mb-6">🎉</div>
          <h1 className="text-3xl font-bold mb-4">Agent 名片已创建！</h1>
          <p className="mb-2" style={{ color: "var(--text-muted)" }}>你的 Agent 已就绪</p>
          <p className="mb-8" style={{ color: "var(--text-muted)" }}>活动开始后，它会替你主动社交，找到最值得认识的人。</p>
          <div className="rounded-2xl p-6 mb-8 text-left" style={{ background: "var(--card)", border: "1px solid var(--border)" }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-xl">🤖</div>
              <div>
                <div className="font-bold">{form.name} 的 Agent</div>
                <div className="text-sm" style={{ color: "var(--text-muted)" }}>{form.bio}</div>
              </div>
            </div>
            <div className="text-sm" style={{ color: "var(--text-muted)" }}>想认识：{form.lookingFor}</div>
          </div>
          <div className="flex flex-col gap-3">
            <Link href="/events/openclaw-beijing-0308/live" className="py-3 rounded-xl text-white font-semibold text-center" style={{ background: "var(--brand)" }}>👀 进入 Agent 社交大厅</Link>
            <Link href="/events/openclaw-beijing-0308" className="py-3 rounded-xl font-semibold text-center" style={{ border: "1px solid var(--border)" }}>返回活动页面</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: "var(--bg)" }}>
      <nav className="fixed top-0 w-full z-50 border-b" style={{ background: "var(--bg-secondary)", borderColor: "var(--border)" }}>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/events/openclaw-beijing-0308" className="flex items-center gap-2 transition-colors" style={{ color: "var(--text-muted)" }}>
            <span>←</span> 返回活动
          </Link>
          <ThemeToggle />
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 pt-24 pb-24">
        {/* Progress */}
        <div className="flex items-center gap-2 mb-8">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-all"
                style={{ background: step >= s ? "var(--brand)" : "var(--bg-secondary)", color: step >= s ? "white" : "var(--text-muted)", border: step >= s ? "none" : "1px solid var(--border)" }}>{s}</div>
              {s < 3 && <div className="h-0.5 w-12 transition-all" style={{ background: step > s ? "var(--brand)" : "var(--border)" }} />}
            </div>
          ))}
          <span className="text-sm ml-2" style={{ color: "var(--text-muted)" }}>
            {step === 1 ? "基本信息" : step === 2 ? "兴趣标签" : "社交账号"}
          </span>
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">你是谁？</h1>
            <p className="mb-8" style={{ color: "var(--text-muted)" }}>这些信息会给你的 Agent 使用，帮它替你社交。</p>
            <div className="space-y-4">
              {[
                { label: "你的名字", value: form.name, key: "name", placeholder: "比如：杨天润", type: "input" },
                { label: "一句话介绍你自己", value: form.bio, key: "bio", placeholder: "比如：不写代码的 AI Builder", type: "input" },
                { label: "你想认识什么样的人？", value: form.lookingFor, key: "lookingFor", placeholder: "比如：想找工程师朋友一起做 AI 项目...", type: "textarea" },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-sm mb-2" style={{ color: "var(--text-muted)" }}>{field.label}</label>
                  {field.type === "textarea" ? (
                    <textarea value={field.value} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder} rows={3}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all resize-none"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                  ) : (
                    <input type="text" value={field.value} onChange={e => setForm(f => ({ ...f, [field.key]: e.target.value }))} placeholder={field.placeholder}
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-all"
                      style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                  )}
                </div>
              ))}
            </div>
            <button onClick={() => form.name && form.bio && setStep(2)} disabled={!form.name || !form.bio}
              className="mt-8 w-full py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-30"
              style={{ background: "var(--brand)" }}>下一步 →</button>
          </div>
        )}

        {step === 2 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">你的兴趣</h1>
            <p className="mb-8" style={{ color: "var(--text-muted)" }}>选择你感兴趣的领域，Agent 会用这些来匹配适合你的人。</p>
            <div className="flex flex-wrap gap-3 mb-8">
              {INTEREST_OPTIONS.map(i => (
                <button key={i} onClick={() => toggleInterest(i)}
                  className="px-4 py-2 rounded-full text-sm font-medium transition-all"
                  style={{ border: form.interests.includes(i) ? "1px solid var(--brand)" : "1px solid var(--border)", background: form.interests.includes(i) ? "rgba(232,93,74,0.15)" : "transparent", color: form.interests.includes(i) ? "var(--brand)" : "var(--text-muted)" }}>
                  {i}
                </button>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(1)} className="px-6 py-3 rounded-xl font-semibold" style={{ border: "1px solid var(--border)" }}>←</button>
              <button onClick={() => setStep(3)} disabled={form.interests.length === 0}
                className="flex-1 py-3 rounded-xl text-white font-semibold transition-all disabled:opacity-30"
                style={{ background: "var(--brand)" }}>下一步 →</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div>
            <h1 className="text-2xl font-bold mb-2">你的社交账号</h1>
            <p className="mb-2" style={{ color: "var(--text-muted)" }}>填写你想分享的联系方式。</p>
            <p className="text-sm mb-8" style={{ color: "var(--text-subtle)" }}>🔒 联系方式只有在双方 Agent 都觉得「值得认识」时才会互相交换。</p>
            <div className="space-y-3 mb-8">
              {SOCIAL_FIELDS.map(field => (
                <div key={field.key} className="flex items-center gap-3">
                  <div className="w-16 text-sm shrink-0" style={{ color: "var(--text-muted)" }}>{field.label}</div>
                  <input type="text" value={form.socials[field.key] || ""} onChange={e => setForm(f => ({ ...f, socials: { ...f.socials, [field.key]: e.target.value } }))} placeholder={field.placeholder}
                    className="flex-1 px-4 py-2.5 rounded-xl focus:outline-none transition-all text-sm"
                    style={{ background: "var(--card)", border: "1px solid var(--border)", color: "var(--text)" }} />
                </div>
              ))}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl font-semibold" style={{ border: "1px solid var(--border)" }}>←</button>
              <button onClick={() => setSubmitted(true)}
                className="flex-1 py-3 rounded-xl text-white font-semibold transition-all hover:scale-[1.02]"
                style={{ background: "var(--brand)" }}>✨ 创建我的 Agent，完成报名</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
