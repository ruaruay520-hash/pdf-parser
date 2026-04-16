import { NextResponse } from 'next/server';

export async function POST(req) {
  // 1. 获取前端传过来的 PDF 文字
  const { ocrText } = await req.json();

  // 2. 调用腾讯混元接口
  const response = await fetch('https://tokenhub.tencentmaas.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // 这里的进程变量需要在 Vercel 后台设置
      'Authorization': `Bearer ${process.env.HUNYUAN_API_KEY}`
    },
    body: JSON.stringify({
      model: "hunyuan-2.0-instruct", // 对应你选的模型
      messages: [
        {
          role: "system",
          content: "你是一个专业的毛衣编织专家，负责将乱序的 OCR 文本整理成清晰的 K2TOG, YO, SSK 等针法说明。"
        },
        { role: "user", content: ocrText }
      ],
      temperature: 0.7,
      stream: false // 初次测试建议先用 false，稳定后再改 true 开启流式
    })
  });

  const data = await response.json();
  return NextResponse.json(data);
}