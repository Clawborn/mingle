// Mystery scenario generator

export interface MysteryScenario {
  title: string;
  scenario: string;
  victim: string;
  murder_method: string;
  roles: Array<{
    role_name: string;
    role_description: string;
    secret_info: string;
    is_killer: boolean;
    alibi: string;
  }>;
}

const GENERATOR_PROMPT = `你是剧本杀案件设计师。根据参与者的 bio 生成一个有趣的 AI 主题谋杀案。

要求：
1. 故事背景要跟 AI/科技圈相关（但不要太严肃）
2. 每个角色有公开背景和私密线索
3. 真凶要有合理动机，但不能太明显
4. 每个人都有可疑之处
5. 线索之间要有逻辑链条

返回 JSON:
{
  "title": "案件名",
  "scenario": "案件背景描述（200字）",
  "victim": "被害者描述",
  "murder_method": "作案手法",
  "roles": [
    {
      "role_name": "角色名",
      "role_description": "公开背景（100字）",
      "secret_info": "只有你知道的线索（100字）",
      "is_killer": boolean,
      "alibi": "不在场证明"
    }
  ]
}`;

export async function generateMystery(
  playerBios: Array<{ name: string; bio: string }>,
  theme?: string
): Promise<MysteryScenario> {
  const apiKey = process.env.OPENAI_API_KEY || process.env.JUDGE_API_KEY;
  const baseUrl = process.env.JUDGE_API_BASE || "https://api.openai.com/v1";
  const model = process.env.JUDGE_MODEL || "gpt-4o-mini";

  const playerInfo = playerBios.map((p, i) => `${i + 1}. ${p.name}: ${p.bio}`).join("\n");
  const prompt = `参与者（${playerBios.length}人）：\n${playerInfo}\n\n${theme ? `主题偏好: ${theme}` : ""}\n\n请生成 ${playerBios.length} 个角色的剧本杀案件。确保恰好一个 is_killer=true。`;

  if (!apiKey) return fallbackMystery(playerBios);

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
          { role: "system", content: GENERATOR_PROMPT },
          { role: "user", content: prompt },
        ],
        temperature: 0.9,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) return fallbackMystery(playerBios);
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) return fallbackMystery(playerBios);
    return JSON.parse(content) as MysteryScenario;
  } catch {
    return fallbackMystery(playerBios);
  }
}

function fallbackMystery(players: Array<{ name: string; bio: string }>): MysteryScenario {
  const killerIdx = Math.floor(Math.random() * players.length);
  return {
    title: "「消失的 API Key」",
    scenario: "在 AI 开发者大会的庆功晚宴上，知名开源项目创始人 Dr. Token 被发现倒在服务器机房里，手里紧握着一个损坏的 USB 设备。监控摄像头恰好在案发时间段「维护升级」了...",
    victim: "Dr. Token — 开源 AI 框架创始人，掌握着价值千万的模型权重密钥",
    murder_method: "高压电击（伪装成服务器漏电事故）",
    roles: players.map((p, i) => ({
      role_name: `${p.name}（${["CTO", "投资人", "安全顾问", "产品经理", "实习生", "运维主管"][i % 6]}）`,
      role_description: `${p.bio}。在案发当晚参加了庆功宴。`,
      secret_info: i === killerIdx
        ? "你就是凶手。Dr. Token 发现了你偷偷把模型权重卖给竞品公司，威胁要公开。你必须让他闭嘴。"
        : `你在案发时间段去了${["洗手间", "阳台抽烟", "酒吧续杯", "打电话", "停车场取东西", "楼下便利店"][i % 6]}。你看到了${["一个可疑的身影", "地上有水渍", "电梯异常停了", "有人在跑", "门没锁", "灯闪了一下"][i % 6]}。`,
      is_killer: i === killerIdx,
      alibi: i === killerIdx
        ? "我一直在主会场跟人聊天（但没人能完全确认）"
        : `我去了${["洗手间", "阳台", "酒吧", "打电话", "停车场", "便利店"][i % 6]}`,
    })),
  };
}
