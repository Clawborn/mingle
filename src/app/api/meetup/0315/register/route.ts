import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 飞书多维表格配置
const FEISHU_APP_ID = process.env.FEISHU_APP_ID || 'cli_a9f197b1c4399cb5';
const FEISHU_APP_SECRET = process.env.FEISHU_APP_SECRET!;
const BITABLE_APP_TOKEN = 'EQWobglkRaX9pesV1bTcsRPKnXe';
// table_id 需要从表格获取，先用空值，后面填入
let BITABLE_TABLE_ID = process.env.BITABLE_TABLE_ID || 'tblRWSLkIxaGJlEy';

async function getFeishuTenantToken(): Promise<string> {
  const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      app_id: FEISHU_APP_ID,
      app_secret: FEISHU_APP_SECRET,
    }),
  });
  const data = await res.json();
  return data.tenant_access_token;
}

async function getTableId(token: string): Promise<string> {
  if (BITABLE_TABLE_ID) return BITABLE_TABLE_ID;
  
  const res = await fetch(
    `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  const tableId = data?.data?.items?.[0]?.table_id;
  if (tableId) BITABLE_TABLE_ID = tableId;
  return tableId || '';
}

async function writeToFeishu(fields: Record<string, unknown>) {
  try {
    const token = await getFeishuTenantToken();
    const tableId = await getTableId(token);
    if (!tableId) {
      console.error('[meetup] 无法获取飞书表格 table_id');
      return;
    }

    const res = await fetch(
      `https://open.feishu.cn/open-apis/bitable/v1/apps/${BITABLE_APP_TOKEN}/tables/${tableId}/records`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ fields }),
      }
    );
    const data = await res.json();
    if (data.code !== 0) {
      console.error('[meetup] 飞书写入失败:', data);
    }
  } catch (e) {
    console.error('[meetup] 飞书写入异常:', e);
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, contact, bio, interests, looking_for, note, agent_name } = body;

    if (!name) {
      return NextResponse.json({ error: '姓名不能为空' }, { status: 400 });
    }
    if (!contact) {
      return NextResponse.json({ error: '联系方式不能为空' }, { status: 400 });
    }

    // 写入 Supabase（备份，失败不阻塞）
    try {
      await supabase
        .from('meetup_registrations')
        .insert({
          event_id: 'openclaw-meetup-0315',
          name,
          contact,
          bio: bio || '',
          interests: interests || '',
          looking_for: looking_for || '',
          note: note || '',
          agent_name: agent_name || '',
          created_at: new Date().toISOString(),
        });
    } catch (dbErr) {
      console.error('[meetup] Supabase 写入失败(非致命):', dbErr);
    }

    // 写入飞书多维表格
    await writeToFeishu({
      '姓名': name,
      'Agent 名字': agent_name || '',
      '联系方式': contact,
      '一句话介绍': bio || '',
      '兴趣标签': interests || '',
      '想认识什么人': looking_for || '',
      '报名时间': Date.now(),
      '备注': note || '',
    });

    return NextResponse.json({
      success: true,
      message: '✅ 报名成功！活动详情将通过微信通知。',
      event: 'OpenClaw Meetup 北京 3月15日',
    });
  } catch (e) {
    console.error('[meetup] 报名异常:', e);
    return NextResponse.json({ error: '服务器错误' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    event: 'OpenClaw Meetup 北京 3月15日',
    date: '2026-03-15',
    location: '北京',
    signup: 'POST /api/meetup/0315/register',
    fields: {
      required: ['name', 'contact'],
      optional: ['bio', 'interests', 'looking_for', 'note', 'agent_name'],
    },
  });
}
