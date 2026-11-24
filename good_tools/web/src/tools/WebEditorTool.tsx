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
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    a.click();
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
        <div
          className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-950/60 overflow-y-auto max-h-[460px] prose prose-sm dark:prose-invert max-w-none [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mb-3 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_ul]:list-disc [&_ul]:pl-5 [&_blockquote]:border-l-4 [&_blockquote]:border-indigo-400 [&_blockquote]:pl-3 [&_blockquote]:text-slate-500 [&_code]:bg-slate-100 [&_code]:dark:bg-slate-800 [&_code]:px-1 [&_code]:rounded"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
