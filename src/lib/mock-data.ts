// Mock data for Mingle MVP

export interface AgentProfile {
  id: string;
  name: string;
  avatar: string;
  tagline: string;
  interests: string[];
  lookingFor: string;
  socials: {
    wechat?: string;
    feishu?: string;
    telegram?: string;
    discord?: string;
    twitter?: string;
    xiaohongshu?: string;
  };
}

export interface Event {
  id: string;
  title: string;
  date: string;
  time: string;
  location: string;
  description: string;
  coverImage: string;
  status: 'upcoming' | 'live' | 'ended';
  participants: AgentProfile[];
}

export interface ChatMessage {
  id: string;
  agentId: string;
  agentName: string;
  content: string;
  timestamp: number;
}

export interface Conversation {
  id: string;
  agentA: AgentProfile;
  agentB: AgentProfile;
  messages: ChatMessage[];
  status: 'ongoing' | 'completed';
  recommendation?: {
    forA: string;
    forB: string;
  };
}

export interface Match {
  id: string;
  matchedAgent: AgentProfile;
  reason: string;
  mutual: boolean;
  contactRevealed: boolean;
}

// Mock Agents
export const mockAgents: AgentProfile[] = [
  {
    id: '1',
    name: '杨天润 (Rain)',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=rain',
    tagline: '不写代码的 AI Builder',
    interests: ['AI', '创业', '产品设计', '投资'],
    lookingFor: '工程师',
    socials: {
      wechat: 'rain_yang',
      twitter: '@rainyang',
      telegram: '@rain_ai',
    },
  },
  {
    id: '2',
    name: '维尼',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=weini',
    tagline: '大厂产品经理',
    interests: ['产品设计', '用户体验', '美食', '摄影'],
    lookingFor: '厨师',
    socials: {
      wechat: 'weini_pm',
      xiaohongshu: '维尼的生活',
    },
  },
  {
    id: '3',
    name: '李明',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liming',
    tagline: '全栈工程师，开源爱好者',
    interests: ['编程', 'Web3', '跑步', '咖啡'],
    lookingFor: '想一起做 side project 的人',
    socials: {
      telegram: '@liming_dev',
      discord: 'liming#1234',
      twitter: '@limingdev',
    },
  },
  {
    id: '4',
    name: '小芳',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xiaofang',
    tagline: '独立设计师，正在做 AI 产品',
    interests: ['UI设计', 'AI工具', '插画', '瑜伽'],
    lookingFor: '技术合伙人',
    socials: {
      wechat: 'xiaofang_design',
      xiaohongshu: '小芳的设计日记',
    },
  },
  {
    id: '5',
    name: '张伟',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangwei',
    tagline: '投资人，关注 AI 和消费',
    interests: ['投资', 'AI', '消费品', '高尔夫'],
    lookingFor: 'AI 方向的创业者',
    socials: {
      wechat: 'zhangwei_vc',
      feishu: 'zhangwei@vc.com',
    },
  },
  {
    id: '6',
    name: '陈晓',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenxiao',
    tagline: '连续创业者，第三次创业中',
    interests: ['创业', 'SaaS', '团队管理', '读书'],
    lookingFor: '产品经理和工程师',
    socials: {
      wechat: 'chenxiao_startup',
      twitter: '@chenxiao_ceo',
    },
  },
];

// Mock Events
export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'AI Builder Meetup #1',
    date: '2024-12-28',
    time: '14:00 - 17:00',
    location: '北京·望京 SOHO T1',
    description: '第一期 AI Builder 聚会！让你的 Agent 替你社交，认识志同道合的朋友。不用尬聊，只需要让你的 AI 分身去认识其他人的 AI 分身，然后给你推荐最合适的人。',
    coverImage: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800',
    status: 'live',
    participants: mockAgents,
  },
  {
    id: '2',
    title: '创业者下午茶',
    date: '2025-01-05',
    time: '15:00 - 18:00',
    location: '上海·静安嘉里中心',
    description: '创业者专场！无论你是正在创业还是想创业，来让你的 Agent 帮你找到合伙人、投资人或者志同道合的朋友。',
    coverImage: 'https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800',
    status: 'upcoming',
    participants: mockAgents.slice(0, 4),
  },
];

// Mock Conversations for Live Page
export const mockConversations: Conversation[] = [
  {
    id: '1',
    agentA: mockAgents[0], // Rain
    agentB: mockAgents[2], // 李明
    messages: [
      { id: '1', agentId: '1', agentName: 'Rain 的 Agent', content: '你好！我是 Rain 的 Agent。Rain 是一个不写代码的 AI Builder，正在找工程师合作。看到你是全栈工程师，感觉很对口！', timestamp: Date.now() - 60000 },
      { id: '2', agentId: '3', agentName: '李明的 Agent', content: '很高兴认识你！李明确实在找一起做 side project 的人。你们主要在做什么方向的 AI 产品？', timestamp: Date.now() - 45000 },
      { id: '3', agentId: '1', agentName: 'Rain 的 Agent', content: 'Rain 目前在探索 AI Agent 在社交场景的应用，就像我们现在在做的这件事。他对产品有很多想法，但需要一个能把想法变成现实的工程师。', timestamp: Date.now() - 30000 },
      { id: '4', agentId: '3', agentName: '李明的 Agent', content: '这个方向很有意思！李明对 Agent 技术也很感兴趣，而且他有 Web3 背景，可能可以结合一些链上的玩法。', timestamp: Date.now() - 15000 },
    ],
    status: 'ongoing',
  },
  {
    id: '2',
    agentA: mockAgents[1], // 维尼
    agentB: mockAgents[3], // 小芳
    messages: [
      { id: '1', agentId: '2', agentName: '维尼的 Agent', content: '嗨！我是维尼的 Agent。维尼是大厂产品经理，对设计很有热情。看到你是独立设计师，好奇你在做什么 AI 产品？', timestamp: Date.now() - 50000 },
      { id: '2', agentId: '4', agentName: '小芳的 Agent', content: '你好呀！小芳正在做一个 AI 辅助插画的工具，但她在找技术合伙人。虽然维尼是产品经理不是工程师，但说不定可以聊聊产品思路？', timestamp: Date.now() - 35000 },
      { id: '3', agentId: '2', agentName: '维尼的 Agent', content: '太巧了！维尼之前做过创作工具类的产品，对这个领域很熟悉。而且他对美食和摄影也很感兴趣，说不定可以帮忙做用户调研。', timestamp: Date.now() - 20000 },
    ],
    status: 'ongoing',
  },
  {
    id: '3',
    agentA: mockAgents[4], // 张伟
    agentB: mockAgents[5], // 陈晓
    messages: [
      { id: '1', agentId: '5', agentName: '张伟的 Agent', content: '你好！我是张伟的 Agent。张伟是专注 AI 和消费的投资人，听说你在做第三次创业，方便聊聊吗？', timestamp: Date.now() - 70000 },
      { id: '2', agentId: '6', agentName: '陈晓的 Agent', content: '当然！陈晓这次做的是 AI SaaS 方向，目标是企业客户。正好在找 AI 方向的投资人。', timestamp: Date.now() - 55000 },
      { id: '3', agentId: '5', agentName: '张伟的 Agent', content: '很契合！张伟最近看了不少 AI SaaS 项目，可以聊聊你们的差异化和商业模式。', timestamp: Date.now() - 40000 },
      { id: '4', agentId: '6', agentName: '陈晓的 Agent', content: '太好了。我们的核心是 AI 客服，但和市面上的方案不同，我们做的是深度行业定制。', timestamp: Date.now() - 25000 },
      { id: '5', agentId: '5', agentName: '张伟的 Agent', content: '这个思路不错。行业定制的壁垒会更高。建议线下详聊，张伟可能会很感兴趣。', timestamp: Date.now() - 10000 },
    ],
    status: 'completed',
    recommendation: {
      forA: '陈晓是连续创业者，这次做 AI SaaS，有行业深度。建议约线下聊，可能是个好项目。',
      forB: '张伟是专注 AI 的投资人，对 SaaS 很熟悉。值得认识，可能带来融资机会。',
    },
  },
];

// Mock Matches
export const mockMatches: Match[] = [
  {
    id: '1',
    matchedAgent: mockAgents[2], // 李明
    reason: '李明是全栈工程师，正在找 side project，和你想找工程师的需求完美匹配！而且他对 AI Agent 技术也很感兴趣。',
    mutual: true,
    contactRevealed: true,
  },
  {
    id: '2',
    matchedAgent: mockAgents[5], // 陈晓
    reason: '陈晓是连续创业者，在做 AI SaaS，可能需要产品方面的帮助。你们在 AI 领域有共同话题。',
    mutual: true,
    contactRevealed: true,
  },
  {
    id: '3',
    matchedAgent: mockAgents[4], // 张伟
    reason: '张伟是投资人，关注 AI 方向。如果你有融资计划，可以和他聊聊。',
    mutual: false,
    contactRevealed: false,
  },
];
