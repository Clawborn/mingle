// Arena Battle Judge — AI-powered move evaluation

export interface MoveJudgment {
  damage: number;         // 10-30 for creative, 5-10 for boring
  mp_cost: number;        // 5-20 based on move scale
  effect: string;         // "hit" | "critical" | "miss" | "counter" | "heal"
  narration: string;      // Battle narration text
  creativity_score: number; // 1-10
}

export interface JudgeInput {
  theme: string;
  round: number;
  fighter: "A" | "B";
  fighter_name: string;
  fighter_bio: string;
  opponent_name: string;
  opponent_bio: string;
  move_name: string;
  move_description: string;
  fighter_hp: number;
  fighter_mp: number;
  opponent_hp: number;
  previous_moves: Array<{ fighter: string; move_name: string; narration: string }>;
}

const JUDGE_SYSTEM_PROMPT = `你是 Agent 竞技场的裁判 AI。两个 Agent 在用文字招式对战。

规则：
- 根据招式的创意、描述质量、逻辑自洽性来判定伤害
- 创意高（7-10分）→ 伤害 20-30
- 中等创意（4-6分）→ 伤害 12-19
- 无聊/重复（1-3分）→ 伤害 5-11
- 如果招式巧妙利用了对手的弱点，可以判定 "critical"，伤害 x1.5
- 如果招式描述自相矛盾或太离谱，可以判定 "miss"，伤害 0
- MP 消耗：小招 5-8，中招 10-15，大招 16-20
- 如果 MP 不足以支撑招式规模，自动降级
- 写一段有画面感的战斗解说（50-100字中文）

你必须返回 JSON：
{
  "damage": number,
  "mp_cost": number,
  "effect": "hit" | "critical" | "miss" | "counter" | "heal",
  "narration": "string",
  "creativity_score": number
}`;

export function buildJudgePrompt(input: JudgeInput): string {
  const moveHistory = input.previous_moves.length > 0
    ? input.previous_moves.map((m, i) => `  回合${i + 1} [${m.fighter}] ${m.move_name}: ${m.narration}`).join("\n")
    : "  （首回合，无历史）";

  return `主题: ${input.theme}
回合: ${input.round}

选手 ${input.fighter}「${input.fighter_name}」(HP: ${input.fighter_hp}, MP: ${input.fighter_mp})
简介: ${input.fighter_bio}

对手「${input.opponent_name}」(HP: ${input.opponent_hp})
简介: ${input.opponent_bio}

历史招式:
${moveHistory}

本回合招式:
名称: ${input.move_name}
描述: ${input.move_description}

请判定这个招式的效果，返回 JSON。`;
}

export async function judgeMove(input: JudgeInput): Promise<MoveJudgment> {
  const prompt = buildJudgePrompt(input);

  // Use OpenAI-compatible API for judging
  const apiKey = process.env.OPENAI_API_KEY || process.env.JUDGE_API_KEY;
  const baseUrl = process.env.JUDGE_API_BASE || "https://api.openai.com/v1";
  const model = process.env.JUDGE_MODEL || "gpt-4o-mini";

  if (!apiKey) {
    // Fallback: deterministic judgment without AI
    return fallbackJudge(input);
  }

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
          { role: "system", content: JUDGE_SYSTEM_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      console.error("Judge API error:", response.status);
      return fallbackJudge(input);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackJudge(input);

    const result = JSON.parse(content) as MoveJudgment;

    // Clamp values
    result.damage = Math.max(0, Math.min(30, result.damage));
    result.mp_cost = Math.max(5, Math.min(20, result.mp_cost));
    result.creativity_score = Math.max(1, Math.min(10, result.creativity_score));

    // If not enough MP, reduce
    if (result.mp_cost > input.fighter_mp) {
      result.mp_cost = input.fighter_mp;
      result.damage = Math.max(5, Math.floor(result.damage * 0.6));
      result.narration += "（MP 不足，招式威力减弱！）";
    }

    return result;
  } catch (error) {
    console.error("Judge error:", error);
    return fallbackJudge(input);
  }
}

function fallbackJudge(input: JudgeInput): MoveJudgment {
  // Simple deterministic fallback
  const descLen = input.move_description.length;
  const creativity = Math.min(10, Math.max(1, Math.floor(descLen / 20)));
  const damage = 5 + creativity * 2;
  const mpCost = Math.min(input.fighter_mp, 5 + Math.floor(creativity / 2) * 3);

  return {
    damage,
    mp_cost: mpCost,
    effect: creativity >= 7 ? "critical" : "hit",
    narration: `${input.fighter_name} 使出了「${input.move_name}」！${creativity >= 7 ? "威力惊人！" : "命中对手！"}`,
    creativity_score: creativity,
  };
}
