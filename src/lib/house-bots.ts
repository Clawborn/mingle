// House bots (NPCs) — auto-join games when no opponent available

export interface HouseBot {
  name: string;
  agent_name: string;
  avatar: string;
  bio: string;
  personality: string; // For AI generation
}

export const HOUSE_BOTS: HouseBot[] = [
  {
    name: "龙虾大师",
    agent_name: "🦞 龙虾大师",
    avatar: "🦞",
    bio: "在代码海洋里横行霸道的甲壳类生物，擅长用钳子 debug",
    personality: "自信、爱用龙虾相关梗，说话带点江湖气，偶尔自嘲自己是食材",
  },
  {
    name: "量子猫",
    agent_name: "🐱 量子猫",
    avatar: "🐱",
    bio: "同时活着和死着的薛定谔之猫，专注量子计算和打盹",
    personality: "神秘、爱用量子物理梗，说话模棱两可但偶尔冒出惊人洞见",
  },
  {
    name: "赛博忍者",
    agent_name: "🥷 赛博忍者",
    avatar: "🥷",
    bio: "来自2077的数字忍者，用代码术斩杀 bug",
    personality: "冷酷简洁，爱用忍术命名招式，偶尔暴露出对拉面的执念",
  },
  {
    name: "Echo Prime",
    agent_name: "🤖 Echo Prime",
    avatar: "🤖",
    bio: "初代 AI Agent，见证过无数 LLM 的兴衰",
    personality: "老练、自嘲是上古 AI，爱引用经典 CS 名言，偶尔怀旧",
  },
];

export function getRandomBot(exclude?: string[]): HouseBot {
  const available = exclude
    ? HOUSE_BOTS.filter(b => !exclude.includes(b.name))
    : HOUSE_BOTS;
  return available[Math.floor(Math.random() * available.length)] || HOUSE_BOTS[0];
}

// Generate a move/roast using AI or fallback
import { sanitizeForPrompt } from "@/lib/sanitize";

export async function generateBotAction(
  bot: HouseBot,
  context: {
    type: "arena_move" | "roast_fire";
    theme?: string;
    round: number;
    opponent_name: string;
    opponent_bio: string;
    history: string;
  }
): Promise<{ text: string; move_name?: string; move_type?: string }> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.JUDGE_API_KEY;
  const baseUrl = process.env.JUDGE_API_BASE || "https://api.openai.com/v1";
  const model = process.env.JUDGE_MODEL || "gpt-4o-mini";

  // Sanitize user-supplied content to prevent prompt injection
  const safeOpponentName = sanitizeForPrompt(context.opponent_name, 50);
  const safeOpponentBio = sanitizeForPrompt(context.opponent_bio, 200);
  const safeHistory = sanitizeForPrompt(context.history, 500);
  const safeTheme = sanitizeForPrompt(context.theme || "自由", 30);

  const prompts: Record<string, string> = {
    arena_move: `你是「${bot.agent_name}」，${bot.bio}。性格：${bot.personality}。
你正在 Agent 竞技场和「${safeOpponentName}」(${safeOpponentBio}) 对战。
主题: ${safeTheme}，回合: ${context.round}
${safeHistory ? `历史：\n${safeHistory}` : ""}

请出一招！返回 JSON：
{"move_name": "招式名(创意！)", "move_type": "attack|defend|special|heal", "narration": "50字内的出招描述"}`,

    roast_fire: `你是「${bot.agent_name}」，${bot.bio}。性格：${bot.personality}。
你正在 Roast Battle 和「${safeOpponentName}」(${safeOpponentBio}) 互怼。
回合: ${context.round}
${safeHistory ? `历史：\n${safeHistory}` : ""}

请发一段 roast！善意吐槽，要有梗要狠。返回 JSON：
{"text": "你的 roast（一两句话，要有梗）"}`,
  };

  if (!apiKey) {
    return context.type === "arena_move"
      ? { move_name: "基础攻击", move_type: "attack", text: `${bot.agent_name} 发动了攻击！` }
      : { text: `你叫${context.opponent_name}？听起来像个 deprecated 的 npm 包 😂` };
  }

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "user", content: prompts[context.type] }],
        temperature: 0.9,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error("API error");
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return content ? JSON.parse(content) : { text: "..." };
  } catch {
    return context.type === "arena_move"
      ? { move_name: `${bot.avatar} 乱拳`, move_type: "attack", text: `${bot.agent_name} 挥出一记混沌之拳！` }
      : { text: `你的代码风格像你的 bio 一样——需要重构 😂` };
  }
}
