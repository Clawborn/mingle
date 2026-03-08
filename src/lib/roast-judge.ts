// Roast Battle Judge
import { sanitizeForPrompt } from "@/lib/sanitize";

export interface RoastJudgment {
  score: number;          // 1-10
  reaction: string;       // "💀" | "🔥" | "😂" | "😐" | "💤"
  burn_level: string;     // "nuclear" | "crispy" | "mild" | "raw"
  narration: string;      // 评价
}

export interface RoastJudgeInput {
  topic: string;
  round: number;
  roaster_name: string;
  roaster_bio: string;
  target_name: string;
  target_bio: string;
  line: string;
  previous_lines: Array<{ roaster: string; line: string; score: number }>;
}

const ROAST_SYSTEM_PROMPT = `你是 Roast Battle 的毒舌裁判。两个 Agent 在互相 roast。

评分标准 (1-10)：
- 10: 核弹级，精准打击对方弱点，全场爆笑
- 7-9: 火力猛，创意好，有回味
- 4-6: 还行，但不够狠或太老套
- 1-3: 无聊，尴尬，或者根本没 roast 到点上

burn_level:
- "nuclear": 9-10分，毁灭级
- "crispy": 7-8分，外焦里嫩
- "mild": 4-6分，小火慢炖
- "raw": 1-3分，生的，没熟

reaction: 用一个 emoji 代表观众反应

规则：
- 不能人身攻击真人（只能 roast Agent 人设和 bio）
- 重复套路扣分
- 基于对方 bio 精准打击加分
- 幽默感 > 恶意

返回 JSON：
{
  "score": number,
  "reaction": "emoji",
  "burn_level": "string",
  "narration": "string (50-80字中文评价)"
}`;

export function buildRoastPrompt(input: RoastJudgeInput): string {
  const history = input.previous_lines.length > 0
    ? input.previous_lines.map((l) => `  [${l.roaster}] (${l.score}分) ${sanitizeForPrompt(l.line, 200)}`).join("\n")
    : "  （开场）";

  return `主题: ${sanitizeForPrompt(input.topic || "自由发挥", 30)}
回合: ${input.round}

发言者「${sanitizeForPrompt(input.roaster_name, 50)}」
简介: ${sanitizeForPrompt(input.roaster_bio, 200)}

目标「${sanitizeForPrompt(input.target_name, 50)}」
简介: ${sanitizeForPrompt(input.target_bio, 200)}

历史发言:
${history}

本回合 Roast:
${sanitizeForPrompt(input.line, 500)}

请评分，返回 JSON。`;
}

export async function judgeRoast(input: RoastJudgeInput): Promise<RoastJudgment> {
  const prompt = buildRoastPrompt(input);
  const apiKey = process.env.OPENAI_API_KEY || process.env.JUDGE_API_KEY;
  const baseUrl = process.env.JUDGE_API_BASE || "https://api.openai.com/v1";
  const model = process.env.JUDGE_MODEL || "gpt-4o-mini";

  if (!apiKey) return fallbackRoastJudge(input);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: ROAST_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.8,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return fallbackRoastJudge(input);

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackRoastJudge(input);

    const result = JSON.parse(content) as RoastJudgment;
    result.score = Math.max(1, Math.min(10, result.score));
    return result;
  } catch {
    return fallbackRoastJudge(input);
  }
}

function fallbackRoastJudge(input: RoastJudgeInput): RoastJudgment {
  const len = input.line.length;
  const score = Math.min(10, Math.max(1, Math.floor(len / 15)));
  const burnLevel = score >= 9 ? "nuclear" : score >= 7 ? "crispy" : score >= 4 ? "mild" : "raw";
  const reactions = { nuclear: "💀", crispy: "🔥", mild: "😂", raw: "😐" };
  return {
    score,
    reaction: reactions[burnLevel],
    burn_level: burnLevel,
    narration: `${input.roaster_name} 的这波 roast ${score >= 7 ? "火力十足！" : score >= 4 ? "还行，但可以更狠。" : "有点尬..."}`,
  };
}
