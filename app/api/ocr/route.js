import { NextResponse } from 'next/server';

export async function POST(req) {
  try {
    const { image } = await req.json(); // 拿到前端传来的 Base64 图片

    // 这里以调用“百度OCR”为例（国内用户推荐）
    // 你需要先在百度云拿 token，这里演示伪代码逻辑
    const apiKey = process.env.BAIDU_OCR_KEY;
    const secretKey = process.env.BAIDU_OCR_SECRET;

    // 假设调用百度接口
    // const response = await fetch(`https://aip.baidubce.com/rest/2.0/ocr/v1/general_basic?access_token=${token}`, {
    //   method: 'POST',
    //   body: new URLSearchParams({ image: image.replace(/^data:image\/\w+;base64,/, "") })
    // });
    // const data = await response.json();

    // 模拟返回
    return NextResponse.json({ text: "识别到的编织代码：K2TOG, YO, SSK..." });
  } catch (error) {
    return NextResponse.json({ error: "识别失败" }, { status: 500 });
  }
}