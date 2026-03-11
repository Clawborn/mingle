import { NextRequest, NextResponse } from "next/server";

const FEISHU_APP_TOKEN = "AdfJworx9iSfnAkAQ78cYilsnk7";
const FEISHU_TABLE_ID = "tblldwUAvDdWR8cd";

// Get tenant access token
async function getTenantToken() {
  const res = await fetch("https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: process.env.FEISHU_APP_ID,
      app_secret: process.env.FEISHU_APP_SECRET,
    }),
  });
  const data = await res.json();
  return data.tenant_access_token;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    const required = ["name", "session", "identity", "company", "wechat", "phone", "department"];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `缺少必填字段: ${field}` }, { status: 400 });
      }
    }

    // Build fields for Feishu Bitable
    const fields: Record<string, unknown> = {
      "您的姓名": body.name,
      "您计划参加哪部分活动": body.session,
      "您的身份": body.identity,
      "请输入您的单位（学校或企业全称）": body.company,
      "请输入您的微信号": body.wechat,
      "请输入您的手机号": body.phone,
      "请输入您的院系年级（高校）或部门职务（企业）": body.department,
      "填报后将自动跳转链接，扫码进入活动报名咨询群": body.confirm || "我确认",
    };

    // Optional fields
    if (body.identity_other) {
      fields["您的身份-其他-补充内容"] = body.identity_other;
    }
    if (body.partner_interests && body.partner_interests.length > 0) {
      fields["以下是部分合作方对接清单，请勾选您感兴趣的，我们可能会把您的联系方式提供过去"] = body.partner_interests;
    }
    if (body.car_plate) {
      fields["如有自驾车位需求请填写车牌号"] = body.car_plate;
    }
    if (body.need_lunch) {
      fields["是否需要预定一份午饭"] = body.need_lunch;
    }
    if (body.has_agent) {
      fields["您是否已有Claw Agent"] = body.has_agent;
    }
    if (body.agent_intro) {
      fields["您是否已有Claw Agent-是，请简介它的特征及用途-补充内容"] = body.agent_intro;
    }
    if (body.self_intro) {
      fields["请简单介绍您的创业项目/科研方向/自我介绍"] = body.self_intro;
    }

    // Get token and write to Feishu
    const token = await getTenantToken();
    if (!token) {
      return NextResponse.json({ error: "飞书认证失败，请联系管理员" }, { status: 500 });
    }

    const feishuRes = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${FEISHU_APP_TOKEN}/tables/${FEISHU_TABLE_ID}/records`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      }
    );

    const feishuData = await feishuRes.json();

    if (feishuData.code !== 0) {
      console.error("Feishu API error:", feishuData);
      return NextResponse.json({ error: "写入飞书表格失败: " + (feishuData.msg || "未知错误") }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `✅ ${body.name} 报名成功！已写入飞书报名表。`,
      record_id: feishuData.data?.record?.record_id,
    });
  } catch (err) {
    console.error("Signup error:", err);
    return NextResponse.json({ error: "服务器错误" }, { status: 500 });
  }
}
