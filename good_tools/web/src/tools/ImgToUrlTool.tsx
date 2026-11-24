import { useState } from 'react';
import { Upload } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

export default function ImgToUrlTool() {
  const [dataUrl, setDataUrl] = useState('');
  const [info, setInfo] = useState('');

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result || '');
      setDataUrl(res);
      setInfo(`${file.name} · 원본 ${(file.size / 1024).toFixed(1)} KB · Base64 ${(res.length / 1024).toFixed(1)} KB`);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-4">
      <label className="flex flex-col items-center justify-center gap-2 p-6 rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-400 cursor-pointer bg-slate-50 dark:bg-slate-800/40">
        <Upload className="w-6 h-6 text-indigo-500" />
        <span className="text-sm font-medium">이미지를 선택하면 Base64 Data URL로 즉시 변환합니다</span>
        <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
      </label>

      {info && <div className="text-xs text-slate-500">{info}</div>}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-semibold text-slate-500">Data URL (여기에 기존 Data URL을 붙여넣어도 미리보기 가능)</span>
          <div className="flex gap-1.5">
            <CopyButton text={dataUrl} label="Data URL 복사" />
            <CopyButton text={dataUrl ? `<img src="${dataUrl}" alt="image" />` : ''} label="HTML <img> 복사" />
            <CopyButton text={dataUrl ? `background-image: url('${dataUrl}');` : ''} label="CSS 복사" />
          </div>
        </div>
        <textarea
          rows={6}
          value={dataUrl}
          onChange={(e) => setDataUrl(e.target.value)}
          placeholder="data:image/png;base64,..."
          className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 font-mono text-xs break-all"
        />
      </div>

      {dataUrl.startsWith('data:image/') && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 flex justify-center">
          <img src={dataUrl} alt="Preview" className="max-h-72 rounded-lg shadow-sm" />
        </div>
      )}
    </div>
  );
}
