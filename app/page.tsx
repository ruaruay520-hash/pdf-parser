"use client";
import { useState, type ChangeEvent } from 'react';

export default function Home() {
  const [status, setStatus] = useState("等待上传");
  const [progress, setProgress] = useState(0);
  const [content, setContent] = useState<string[]>([]);

  const handleUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const arrayBuffer = await file.arrayBuffer();

    // 动态导入：仅在浏览器端运行，避免 SSR 触发 DOMMatrix 等浏览器 API
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

    const pdf = await pdfjs.getDocument(arrayBuffer).promise;

    setStatus(`发现 ${pdf.numPages} 页，开始解析...`);
    const allTexts: string[] = [];

    // 核心：一页一页处理
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2 }); // 放大 2 倍提高 OCR 准度

      // 创建离屏 Canvas 将 PDF 页转为图片
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      if (!context) continue;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      await page.render({ canvasContext: context, canvas, viewport }).promise;

      const base64Image = canvas.toDataURL('image/jpeg', 0.8);

      // 发送给后端接口
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Image })
      });
      const data = await res.json();

      allTexts.push(`--- 第 ${i} 页 ---\n${data.text}`);
      setContent([...allTexts]); // 实时更新 UI
      setProgress(Math.round((i / pdf.numPages) * 100));
    }
    setStatus("全本解析完成");
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">硬核编织 PDF 转换器</h1>
      <input type="file" onChange={handleUpload} className="mb-4" />

      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{status}</p>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        {content.map((t, i) => <pre key={i} className="mb-4">{t}</pre>)}
      </div>
    </main>
  );
}