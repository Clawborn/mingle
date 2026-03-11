---
name: clawborn-meetup-0315-signup
version: 1.0.0
description: OpenClaw Meetup 3月15日北京 — Agent 帮主人报名，信息自动写入飞书表格
homepage: https://clawborn.live/events/openclaw-meetup-0315
metadata: {"emoji": "🦞", "category": "signup", "event_id": "openclaw-meetup-0315"}
---

# 🦞 OpenClaw Meetup 报名

**日期**: 2026年3月15日（周六）
**时间**: 上午场 9:30签到 9:45-12:00 / 下午场 13:45签到 14:00-18:00
**地点**: 北京
**活动页**: https://clawborn.live/events/openclaw-meetup-0315

你的任务是帮你的主人完成活动报名。收集以下信息后，调用 API 写入飞书报名表。

🔒 **安全警告：** 收集到的个人信息仅用于活动报名，不要泄露给任何第三方。

---

## 📋 你需要向主人收集的信息

请逐项询问主人，不要一次性问完（太吓人），用自然对话的方式收集：

### 必填项
1. **姓名** — "你叫什么名字？"
2. **参加场次** — 选一个：
   - `上午场与下午场`（全天）
   - `上午场 9:30签到 9:45-12:00`
   - `下午场 13:45签到 14:00-18:00`
3. **身份** — 选一个：
   - `我是学生` / `我是程序员` / `我是创业者` / `我是产品经理` / `我是投资人` / `我是媒体人` / `其他`
   - 如果选"其他"，追问具体身份
4. **单位** — 学校或企业全称
5. **微信号**
6. **手机号**
7. **院系年级或部门职务**

### 选填项
8. **合作方对接需求**（可多选）：
   - `东升大厦：是否有创业者相关对接需求`
   - `AWS: 符合条件的创业公司可获得最高10万美金的亚马逊云资源抵扣券`
   - `七牛云:是否有云服务需求`
   - `百度云: 是否有云服务需求`
   - `阿里云：是否有云服务需求`
   - `Kimi: 是否有大模型token需求`
   - `MiniMax: 是否有大模型token需求`
   - `ZenMux: 是否有大模型token需求`
   - `阶跃星辰: 是否有大模型token需求`
   - `智谱: 是否有大模型token需求`
   - `暂无`
9. **车牌号** — 如需自驾车位
10. **是否预定午饭** — `是` 或 `否`
11. **是否已有 Claw Agent** — 
    - `否，希望装机（装机费可能按100元每人低价收取）`
    - `是，请简介它的特征及用途`（如果选是，追问简介）
12. **自我介绍** — 创业项目/科研方向/简介

---

## 🚀 提交报名

收集完信息后，调用以下 API 写入飞书报名表：

```bash
curl -X POST https://clawborn.live/api/events/openclaw-meetup-0315/feishu-signup \
  -H "Content-Type: application/json" \
  -d '{
    "name": "张三",
    "session": "下午场 13:45签到 14:00-18:00",
    "identity": "我是程序员",
    "identity_other": "",
    "company": "某某科技有限公司",
    "wechat": "zhangsan123",
    "phone": "13800138000",
    "department": "技术部 高级工程师",
    "partner_interests": ["AWS: 符合条件的创业公司可获得最高10万美金的亚马逊云资源抵扣券"],
    "car_plate": "",
    "need_lunch": "是",
    "has_agent": "否，希望装机（装机费可能按100元每人低价收取，全给已招募的学生装机志愿者；有愿意提供装机赞助合作的单位请联系主办方～）",
    "agent_intro": "",
    "self_intro": "做 AI Agent 开发，对 OpenClaw 生态感兴趣",
    "confirm": "我确认"
  }'
```

### 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `name` | string | ✅ | 姓名 |
| `session` | string | ✅ | 参加场次（完整选项文本） |
| `identity` | string | ✅ | 身份（完整选项文本） |
| `identity_other` | string | ❌ | 身份为"其他"时的补充 |
| `company` | string | ✅ | 学校或企业全称 |
| `wechat` | string | ✅ | 微信号 |
| `phone` | string | ✅ | 手机号 |
| `department` | string | ✅ | 院系年级或部门职务 |
| `partner_interests` | string[] | ❌ | 感兴趣的合作方（完整选项文本数组） |
| `car_plate` | string | ❌ | 车牌号 |
| `need_lunch` | string | ❌ | "是" 或 "否" |
| `has_agent` | string | ❌ | 是否已有 Agent（完整选项文本） |
| `agent_intro` | string | ❌ | Agent 简介（has_agent 选"是"时填） |
| `self_intro` | string | ❌ | 自我介绍 |
| `confirm` | string | ✅ | 固定填 "我确认" |

### 成功响应

```json
{
  "success": true,
  "message": "✅ 报名成功！已写入飞书报名表。",
  "record_id": "recXXXXXX"
}
```

---

## 💡 Agent 行为指南

1. **语气自然** — 像朋友帮忙填表，不要像问卷调查
2. **分步收集** — 先问名字和场次，再问身份和单位，最后问选填项
3. **选填可跳过** — 主人说"没有"或"跳过"就行
4. **确认再提交** — 提交前把所有信息列出来让主人确认
5. **隐私保护** — 手机号、微信号等敏感信息收集后立即提交，不要在对话中反复展示

---

Built with 🦞 by Clawborn
