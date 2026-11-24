import { previewDocument } from '../utils/preview';
import { downloadBlob } from '../utils/download';
import { useEffect, useMemo, useState } from 'react';
import { marked } from 'marked';
import { Download } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

const DEFAULT_MD = `# Good Tools 웹 에디터

실시간 **Markdown** 작성 및 HTML 미리보기를 지원하며 브라우저에 자동 저장됩니다.

## 주요 기능
- 굵게, *기울임*, \`인라인 코드\`
- 실시간 분할 미리보기
- HTML 또는 Markdown 파일로 즉시 내보내기

> 팁: Home Assistant 문서나 메모 초안을 작성할 때 유용합니다.
`;

export default function WebEditorTool() {
  const [content, setContent] = useState(() => localStorage.getItem('good_tools_editor') || DEFAULT_MD);

  useEffect(() => {
    localStorage.setItem('good_tools_editor', content);
  }, [content]);

  const html = useMemo(() => marked.parse(content, { async: false }) as string, [content]);

  const insertSnippet = (before: string, after = '') => {
    setContent((prev) => `${prev}\n${before}텍스트${after}`);
  };

  const downloadFile = (text: string, filename: string, mime: string) => {
    const blob = new Blob([text], { type: mime });
    downloadBlob(blob, filename);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-1.5 pb-2 border-b border-slate-200 dark:border-slate-800">
        {[
          { label: 'H2', action: () => insertSnippet('## ') },
          { label: '굵게', action: () => insertSnippet('**', '**') },
          { label: '기울임', action: () => insertSnippet('*', '*') },
          { label: '코드', action: () => insertSnippet('```\n', '\n```') },
          { label: '목록', action: () => insertSnippet('- ') },
          { label: '인용', action: () => insertSnippet('> ') },
        ].map((btn) => (
          <button
            key={btn.label}
            type="button"
            onClick={btn.action}
            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-medium cursor-pointer"
          >
            {btn.label}
          </button>
        ))}

        <div className="ml-auto flex items-center gap-1.5">
          <CopyButton text={html} label="HTML 복사" />
          <button
            type="button"
            onClick={() => downloadFile(content, 'document.md', 'text/markdown')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> .md
          </button>
          <button
            type="button"
            onClick={() => downloadFile(html, 'document.html', 'text/html')}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" /> .html
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={18}
          className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-sm outline-none focus:border-indigo-500 resize-y"
          placeholder="Markdown을 입력하세요..."
        />
        <iframe
          title="Markdown Preview"
          sandbox=""
          srcDoc={previewDocument(`<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:system-ui,-apple-system,sans-serif;padding:16px;margin:0;color:#0f172a;line-height:1.6;font-size:14px}h1{font-size:1.4em;margin-top:0}h2{font-size:1.15em;margin-top:1.2em}pre,code{background:#f1f5f9;border-radius:6px;font-family:monospace}code{padding:2px 5px}pre{padding:10px;overflow:auto}blockquote{border-left:4px solid #6366f1;margin:0;padding-left:12px;color:#475569}</style></head><body>${html}</body></html>`)}
          className="w-full h-[460px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
        />
      </div>
    </div>
  );
}
