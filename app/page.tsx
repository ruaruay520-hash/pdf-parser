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
    pdfjs.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

    const pdf = await pdfjs.getDocument(arrayBuffer).promise;
    setStatus(`发现 ${pdf.numPages} 页，开始提取文字...`);
    const allTexts: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);

      // 直接从 PDF 文字层提取，无需 OCR
      const textContent = await page.getTextContent();
      const rawText = textContent.items
        .map((item: any) => ('str' in item ? item.str : ''))
        .join(' ')
        .trim();

      // 发给后端 instruct 模型整理格式
      const res = await fetch('/api/ocr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ocrText: rawText }),
      });
      const data = await res.json();

      const pageText = data.text ?? `[错误] ${data.error ?? '未知错误'}${data.detail ? '\n' + data.detail : ''}`;
      allTexts.push(`--- 第 ${i} 页 ---\n${pageText}`);
      setContent([...allTexts]);
      setProgress(Math.round((i / pdf.numPages) * 100));
    }
    setStatus("全本解析完成");
  };

  return (
    <main className="p-8 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">硬核编织 PDF 转换器</h1>
      <input type="file" accept=".pdf" onChange={handleUpload} className="mb-4" />

      <div className="w-full bg-gray-200 rounded-full h-4 mb-4">
        <div className="bg-blue-600 h-4 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
      </div>
      <p className="text-sm text-gray-600 mb-4">{status}</p>

      <div className="bg-black text-green-400 p-4 rounded font-mono text-sm h-96 overflow-y-auto">
        {content.map((t, i) => <pre key={i} className="mb-4 whitespace-pre-wrap">{t}</pre>)}
      </div>
    </main>
  );
}