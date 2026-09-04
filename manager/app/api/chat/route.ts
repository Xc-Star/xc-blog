import { getSiteConfig } from '../../../lib/content.server';

// 需要查库读取密钥，因此不能跑在 edge runtime
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type AiConfig = {
  baseUrl?: string;
  apiKey?: string;
  modelId?: string;
  systemPrompt?: string;
  maxOutputTokens?: number;
  temperature?: number;
};

export async function POST(req: Request) {
  try {
    const { message } = await req.json();
    if (typeof message !== 'string' || !message.trim()) {
      return Response.json({ error: '消息不能为空' }, { status: 400 });
    }

    const site = await getSiteConfig();
    const config = (site.geminiConfig ?? {}) as AiConfig;

    const baseUrl = (config.baseUrl || '').trim().replace(/\/+$/, '');
    const apiKey = (config.apiKey || '').trim();
    const model = (config.modelId || '').trim();

    if (!baseUrl || !apiKey || !model) {
      return Response.json({ error: '尚未在管理端配置 AI 接口地址 / 密钥 / 模型' }, { status: 503 });
    }

    // 管理端把物理换行存成了字面量 \n，这里还原
    const systemPrompt = (config.systemPrompt || '').replace(/\\n/g, '\n').trim();

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
          { role: 'user', content: message.slice(0, 2000) },
        ],
        max_tokens: config.maxOutputTokens ?? 150,
        temperature: config.temperature ?? 0.85,
      }),
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      console.error('[chat] 模型接口拒绝请求:', response.status, data?.error?.message);
      return Response.json(
        { error: `模型接口返回 ${response.status}`, details: data?.error?.message || '未知错误' },
        { status: response.status },
      );
    }

    const reply = data?.choices?.[0]?.message?.content?.trim() || '本喵现在不想理你喵...';
    return Response.json({ reply });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : '未知错误';
    console.error('[chat] 运行时异常:', message);
    return Response.json({ error: message }, { status: 500 });
  }
}
