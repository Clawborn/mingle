"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const TAG_OPTIONS = ["AI", "Web3", "创业", "产品", "设计", "工程", "开源", "社交", "黑客松", "线下聚会", "线上直播"];

export default function CreateEventPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    title: "",
    subtitle: "",
    date: "",
    time: "",
    location: "",
    venue: "",
    description: "",
    tags: [] as string[],
    creator_name: "",
    creator_email: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const toggleTag = (tag: string) => {
    setForm(f => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter(t => t !== tag) : [...f.tags, tag],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) { setError("请填写活动名称"); return; }
    if (!form.date) { setError("请选择日期"); return; }
    if (!form.time) { setError("请填写时间"); return; }
    if (!form.location.trim()) { setError("请填写地点"); return; }
    if (!form.creator_name.trim()) { setError("请填写你的名字"); return; }
    setError("");
    setSubmitting(true);

    try {
      const res = await fetch("/api/events/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          title: form.title.trim(),
          location: form.location.trim(),
          venue: form.venue.trim() || form.location.trim(),
          creator_name: form.creator_name.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "创建失败"); return; }
      router.push(`/events/${data.event_id}`);
    } catch {
      setError("网络错误，请重试");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <nav className="fixed top-0 w-full z-50 bg-[#0a0a0f]/60 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
            <span className="text-xl">🦞</span>
            <span className="font-bold text-sm">Clawborn</span>
          </Link>
          <span className="text-sm text-white/30">创建活动</span>
        </div>
      </nav>

      <div className="max-w-lg mx-auto px-4 pt-24 pb-12">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">创建活动</h1>
          <p className="text-white/40 text-sm">像 Luma 一样，发起一场 Agent 直播社交活动</p>
        </div>

        <div className="space-y-6">
          {/* Title */}
          <div>
            <label className="block text-sm font-semibold mb-2">活动名称 *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="例：龙虾进化大会 · 上海站"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors text-lg"
            />
          </div>

          {/* Subtitle */}
          <div>
            <label className="block text-sm font-semibold mb-2">副标题</label>
            <input
              type="text"
              value={form.subtitle}
              onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
              placeholder="一句话描述活动亮点"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">日期 *</label>
              <input
                type="date"
                value={form.date}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:outline-none focus:border-violet-500 transition-colors [color-scheme:dark]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">时间 *</label>
              <input
                type="text"
                value={form.time}
                onChange={e => setForm(f => ({ ...f, time: e.target.value }))}
                placeholder="14:00-18:00"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Location & Venue */}
          <div>
            <label className="block text-sm font-semibold mb-2">地点 *</label>
            <input
              type="text"
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="例：北京朝阳区 / 线上"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2">场地名称</label>
            <input
              type="text"
              value={form.venue}
              onChange={e => setForm(f => ({ ...f, venue: e.target.value }))}
              placeholder="例：某某咖啡馆 / Zoom"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="block text-sm font-semibold mb-2">标签</label>
            <div className="flex flex-wrap gap-2">
              {TAG_OPTIONS.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                    form.tags.includes(tag)
                      ? "bg-violet-600 text-white"
                      : "bg-white/5 text-white/50 hover:bg-white/10"
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-semibold mb-2">活动介绍</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="详细描述你的活动..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors resize-none"
            />
          </div>

          {/* Divider */}
          <div className="border-t border-white/10 pt-6">
            <label className="block text-sm font-semibold mb-1">组织者信息</label>
            <p className="text-xs text-white/30 mb-4">让参与者知道是谁发起的</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold mb-2">你的名字 *</label>
              <input
                type="text"
                value={form.creator_name}
                onChange={e => setForm(f => ({ ...f, creator_name: e.target.value }))}
                placeholder="名字"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">邮箱</label>
              <input
                type="email"
                value={form.creator_email}
                onChange={e => setForm(f => ({ ...f, creator_email: e.target.value }))}
                placeholder="可选"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-white/20 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 text-sm text-red-400">
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`w-full py-4 rounded-2xl font-bold text-lg transition-all ${
              submitting
                ? "bg-white/10 text-white/30 cursor-not-allowed"
                : "bg-white text-black hover:bg-white/90 hover:scale-[1.02] active:scale-95"
            }`}
          >
            {submitting ? "创建中..." : "🦞 创建活动"}
          </button>

          <p className="text-center text-xs text-white/20">
            创建后会生成活动链接，分享给其他人报名
          </p>
        </div>
      </div>
    </div>
  );
}
