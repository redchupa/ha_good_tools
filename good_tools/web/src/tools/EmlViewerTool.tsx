import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { previewDocument } from '../utils/preview';
import { downloadBlob } from '../utils/download';
import { useState } from 'react';
import PostalMime, { type Email } from 'postal-mime';
import { Upload, Paperclip, Download } from 'lucide-react';

export default function EmlViewerTool() {
  const ui = useText();
  const [email, setEmail] = useState<Email | null>(null);
  const [viewMode, setViewMode] = useState<'html' | 'text'>('html');
  const [error, setError] = useState('');

  const handleFile = async (file: File) => {
    setError('');
    try {
      if (file.size > 16 * 1024 * 1024) throw new Error(ui('EML은 16 MiB까지 지원합니다.', "EML files can be up to 16 MiB."));
      const parser = new PostalMime();
      const parsed = await parser.parse(await file.arrayBuffer());
      setEmail(parsed);
      setViewMode(parsed.html ? 'html' : 'text');
    } catch (err) {
      setError(err instanceof Error ? err.message : ui('EML 파일 파싱에 실패했습니다.', "Could not read this EML file."));
    }
  };

  const downloadAttachment = (att: Email['attachments'][number]) => {
    const data = att.content instanceof ArrayBuffer ? new Uint8Array(att.content) : new TextEncoder().encode(String(att.content));
    const blob = new Blob([data], { type: att.mimeType || 'application/octet-stream' });
    downloadBlob(blob, att.filename || 'attachment');
  };

  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
        <Upload className="w-6 h-6 text-indigo-500" />
        <span className="text-sm font-medium">{ui(".eml 이메일 파일을 선택하세요", "Choose an .eml email file")}</span>
        <span className="text-xs text-slate-400">{ui("서버로 전송되지 않고 브라우저 내에서 안전하게 파싱됩니다", "Email is processed locally in your browser.")}</span>
        <input
          type="file"
          accept=".eml,message/rfc822"
          className="hidden"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
      </label>

      {error && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-sm"><Diagnostic text={error} /></div>}

      {email && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-1.5 text-sm">
            <h2 className="text-base font-bold">{email.subject || ui('(제목 없음)', "(No subject)")}</h2>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <strong>{ui("보낸 사람:", "From:")}</strong> {email.from?.name ? `${email.from.name} <${email.from.address}>` : email.from?.address || '-'}
            </div>
            <div className="text-xs text-slate-600 dark:text-slate-300">
              <strong>{ui("받는 사람:", "To:")}</strong> {(email.to || []).map((t) => t.address).join(', ') || '-'}
            </div>
            <div className="text-xs text-slate-500">
              <strong>{ui("날짜:", "Date:")}</strong> {email.date || '-'}
            </div>
          </div>

          {email.attachments && email.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {email.attachments.map((att, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => downloadAttachment(att)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs hover:border-indigo-400 cursor-pointer"
                >
                  <Paperclip className="w-3.5 h-3.5 text-indigo-500" />
                  <span>{att.filename || ui(`첨부파일-${idx + 1}`, `attachment-${idx + 1}`)}</span>
                  <Download className="w-3 h-3 opacity-60" />
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setViewMode('html')}
              disabled={!email.html}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 ${
                viewMode === 'html' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {ui("HTML 본문 (샌드박스)", "HTML body (sandboxed)")}
            </button>
            <button
              type="button"
              onClick={() => setViewMode('text')}
              disabled={!email.text}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer disabled:opacity-40 ${
                viewMode === 'text' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {ui("텍스트 본문", "Text body")}
            </button>
          </div>

          {viewMode === 'html' && email.html ? (
            <iframe
              title="EML Body"
              sandbox=""
              srcDoc={previewDocument(email.html)}
              className="w-full h-[460px] rounded-xl border border-slate-200 dark:border-slate-700 bg-white"
            />
          ) : (
            <pre className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs whitespace-pre-wrap overflow-auto max-h-[460px]">
              {email.text || ui('(본문 없음)', "(No body)")}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
