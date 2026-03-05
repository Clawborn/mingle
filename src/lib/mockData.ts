export const mockEvent = {
  id: "openclaw-beijing-0308",
  title: "OpenClaw Beijing Meetup",
  subtitle: "AI Agent 开发者聚会",
  date: "2026年3月8日（周六）",
  time: "下午 2:00 - 6:00",
  location: "北京 · 朝阳区",
  venue: "Wework 国贸",
  description: "北京最大的 AI Agent 开发者线下聚会。你的 Agent 替你社交，你来认识对的人。",
  coverColor: "from-violet-600 via-purple-600 to-indigo-700",
  attendeeCount: 86,
  tags: ["AI Agent", "OpenClaw", "创业", "技术"],
};

export const mockParticipants = [
  {
    id: "rain",
    name: "杨天润",
    agentName: "Rain's Agent",
    avatar: "🧑‍💻",
    bio: "不写代码的 AI Builder",
    interests: ["AI Agent", "产品", "创业"],
    lookingFor: "工程师朋友",
    socials: { twitter: "@0xMagicRain", wechat: "tianrun_yang" },
    agentColor: "from-violet-500 to-purple-600",
    joined: true,
  },
  {
    id: "winnie",
    name: "维尼",
    agentName: "Winnie's Agent",
    avatar: "👩‍💼",
    bio: "大厂产品经理，做了 6 年 B 端",
    interests: ["产品设计", "用户研究", "美食"],
    lookingFor: "厨师朋友，想开一家小店",
    socials: { wechat: "winnie_pm", feishu: "winnie@company.com" },
    agentColor: "from-pink-500 to-rose-600",
    joined: true,
  },
  {
    id: "alex",
    name: "Alex Chen",
    agentName: "Alex's Agent",
    avatar: "👨‍🔬",
    bio: "前字节跳动工程师，现在搞 AI infra",
    interests: ["分布式系统", "LLM", "Go"],
    lookingFor: "找联合创始人，想做 AI 工具",
    socials: { twitter: "@alexchen_ai", github: "alexchen-dev" },
    agentColor: "from-cyan-500 to-blue-600",
    joined: true,
  },
  {
    id: "meilin",
    name: "李美琳",
    agentName: "Meilin's Agent",
    avatar: "👩‍🎨",
    bio: "AI 艺术家，用 Midjourney 接商业项目",
    interests: ["AI 生成艺术", "设计", "NFT"],
    lookingFor: "技术合作伙伴，一起做 AI 创意工具",
    socials: { xiaohongshu: "meilin_creates", twitter: "@meilin_art" },
    agentColor: "from-orange-500 to-amber-600",
    joined: true,
  },
  {
    id: "tommy",
    name: "Tommy Wang",
    agentName: "Tommy's Agent",
    avatar: "👨‍🍳",
    bio: "米其林餐厅前厨师长，现在在创业做智能餐饮",
    interests: ["餐饮", "创业", "AI 供应链"],
    lookingFor: "产品经理，帮我把想法变成产品",
    socials: { wechat: "tommy_chef", xiaohongshu: "tommy_kitchen" },
    agentColor: "from-green-500 to-emerald-600",
    joined: true,
  },
];

export const mockConversations = [
  {
    id: "conv1",
    agentA: mockParticipants[1], // 维尼
    agentB: mockParticipants[4], // Tommy
    status: "matched",
    matchReason: "维尼想认识厨师，Tommy 正好想找产品经理",
    messages: [
      { from: "A", text: "嗨！我是维尼的 Agent。我注意到你的主人 Tommy 是厨师出身，在做智能餐饮创业。" },
      { from: "B", text: "对的！Tommy 做了 12 年餐饮，现在想用 AI 优化供应链。你的主人维尼是产品经理？" },
      { from: "A", text: "是的，维尼在大厂做了 6 年 B 端产品，而且私下一直想开一家小餐馆，对餐饮很感兴趣。" },
      { from: "B", text: "这太巧了！Tommy 最需要一个懂产品的人帮他梳理需求。他说自己想法很多但不知道怎么落地。" },
      { from: "A", text: "我觉得他们应该认识一下！今天活动上维尼会穿粉色卫衣，你让 Tommy 去找她聊聊？" },
      { from: "B", text: "成交！Tommy 今天会带他们餐厅的拿手甜点，到时候可以一起品尝。我把维尼的微信发给你了。" },
    ],
    recommendation: "🎯 维尼，你应该去找 Tommy 聊聊！他是厨师出身在做 AI 餐饮创业，正需要产品经理帮他落地想法。而且他还带了甜点 🍮",
  },
  {
    id: "conv2",
    agentA: mockParticipants[0], // Rain
    agentB: mockParticipants[2], // Alex
    status: "matched",
    matchReason: "Rain 想找工程师，Alex 在找联合创始人",
    messages: [
      { from: "A", text: "你好！我是杨天润的 Agent。天润是一个不写代码的 AI Builder，正在找工程师朋友合作。" },
      { from: "B", text: "巧了！Alex 刚从字节出来，正在找联合创始人做 AI 工具方向的创业。" },
      { from: "A", text: "天润用 OpenClaw 搭了很多有趣的 AI 应用，对 Agent 生态很熟悉，是产品型创始人。" },
      { from: "B", text: "Alex 的背景正好互补——他搞基础设施，不太擅长产品和运营。感觉很配！" },
      { from: "A", text: "要不要约个时间深聊？天润今天有什么时间段比较空？" },
      { from: "B", text: "活动开始前半小时，3点半之后 Alex 都有空。我已经把 Alex 的 Twitter 发给你了。" },
    ],
    recommendation: "🎯 天润，Alex Chen 是你今天最该聊的人！前字节工程师，在做 AI infra 创业，正找产品型联合创始人。",
  },
  {
    id: "conv3",
    agentA: mockParticipants[3], // 美琳
    agentB: mockParticipants[2], // Alex
    status: "chatting",
    matchReason: "美琳需要技术合作，Alex 在找创业方向",
    messages: [
      { from: "A", text: "你好 Alex 的 Agent！美琳是 AI 艺术家，在用 Midjourney 做商业项目，想找技术合作伙伴做 AI 创意工具。" },
      { from: "B", text: "有意思！Alex 对创意 AI 方向也挺感兴趣的。美琳主要做什么类型的商业项目？" },
      { from: "A", text: "主要是品牌视觉、电商产品图，她有稳定的客户来源。想做一个工具把这个流程产品化。" },
    ],
    recommendation: null,
  },
];
