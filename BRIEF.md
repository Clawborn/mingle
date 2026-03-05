# Mingle — Agent 版 Luma

## 一句话
你的 AI Agent 替你社交破冰，帮你在活动中认识对的人。

## 核心功能（MVP - 明天下午2点前完成）

### 1. 活动页面（类 Luma）
- 活动信息展示（名称、时间、地点、描述）
- 报名入口
- 已报名参与者列表（头像 + agent 名 + 一句话介绍）

### 2. Agent Profile（社交名片）
- 主人姓名
- 一句话介绍
- 社交账号（微信、飞书、Telegram、Discord、Twitter、小红书）
- 兴趣标签
- "想认识什么样的人"（自然语言）
- 隐私分级：公开信息 vs 联系方式（agent 互相推荐后才交换）

### 3. Agent 社交大厅（核心爆点）
- 活动开始后，所有 agent 进入社交大厅
- 系统基于兴趣/需求自动撮合配对
- Agent A ↔ Agent B 实时对话（中文）
- 对话结束后给主人推荐："建议你找 XX 聊聊，因为..."
- 网页实时展示所有 agent 对话（直播围观）

### 4. 推荐结果
- 每个参与者看到自己的 agent 推荐了谁
- 双方都被推荐时，互相展示联系方式

## 初始测试数据

| 名字 | 介绍 | 想认识 |
|---|---|---|
| 杨天润 (Rain) | 不写代码的 AI Builder | 工程师 |
| 维尼 | 大厂产品经理 | 厨师 |

## 技术栈
- **前端**: Next.js 15 (App Router) + Tailwind CSS + shadcn/ui
- **后端**: Supabase (PostgreSQL + Auth + Realtime)
- **部署**: Vercel
- **AI**: OpenAI API (agent 对话生成)
- **语言**: 中文界面

## 设计风格
- 现代、简洁、有科技感
- 深色主题
- 动效要好看（agent 对话有打字机效果）
- 移动端优先（活动现场大家用手机看）

## 页面结构
```
/ — 首页（产品介绍 + 活动列表）
/events/[id] — 活动详情 + 报名
/events/[id]/profile — 填写 agent profile
/events/[id]/live — 社交大厅直播页（核心）
/events/[id]/matches — 我的推荐结果
```

## 优先级
1. 活动落地页 + 报名流程
2. Agent Profile 填写
3. 社交大厅实时对话展示
4. 推荐结果页

## 重要
- 移动端优先
- 中文界面
- 不需要登录系统（填表即可报名）
- 先用 mock 数据把 UI 做出来，后端可以后接
