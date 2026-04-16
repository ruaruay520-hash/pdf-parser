import { NextResponse } from 'next/server';

export async function POST(req) {
  const { ocrText } = await req.json();

  if (!ocrText) {
    return NextResponse.json({ error: 'No text provided' }, { status: 400 });
  }

  console.log(`[OCR] text length: ${ocrText.length} chars`);

  let response;
  try {
    response = await fetch('https://tokenhub.tencentmaas.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUNYUAN_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'hunyuan-2.0-instruct',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的毛衣编织专家，负责将提取的 PDF 文字整理成清晰易读的编织说明，保留所有针法术语（如 K2TOG, YO, SSK 等），修正明显的 OCR 乱码，并按段落整理排版。',
          },
          { role: 'user', content: ocrText },
        ],
        temperature: 0.3,
        stream: false,
      }),
    });
  } catch (err) {
    console.error('[OCR] fetch failed:', err);
    return NextResponse.json({ error: `Network error: ${err.message}` }, { status: 502 });
  }

  const raw = await response.text();
  console.log('[OCR] status:', response.status);
  if (!response.ok) {
    console.error('[OCR] error body:', raw);
    return NextResponse.json({ error: `API ${response.status}`, detail: raw }, { status: 502 });
  }

  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON from API', detail: raw }, { status: 502 });
  }

  const text = data.choices?.[0]?.message?.content ?? '';
  return NextResponse.json({ text });
}