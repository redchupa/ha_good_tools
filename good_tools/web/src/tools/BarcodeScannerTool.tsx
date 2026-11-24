import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, Upload, Square } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

export default function BarcodeScannerTool() {
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const active = useRef(false);
  const containerId = 'good-tools-qr-reader';

  const stopCamera = async () => {
    try {
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }
    } catch {}
    setScanning(false);
  };

  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError('');
    if (!window.isSecureContext) {
      setError('실시간 카메라 스캔은 HTTPS(또는 localhost) 환경에서만 브라우저가 허용합니다. HTTP 환경에서는 아래 이미지 업로드 스캔을 이용해 주세요.');
      return;
    }
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      setScanning(true);
      await scannerRef.current.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setResult(decodedText);
          stopCamera();
        },
        () => {}
      );
      if (!active.current) await stopCamera();
    } catch (err) {
      setScanning(false);
      setError(err instanceof Error ? err.message : '카메라를 시작할 수 없습니다.');
    }
  };

  const scanFile = async (file: File) => {
    setError('');
    try {
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(containerId);
      }
      const decoded = await scannerRef.current.scanFile(file, true);
      setResult(decoded);
    } catch {
      setError('이미지에서 바코드 또는 QR코드를 인식하지 못했습니다.');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {!scanning ? (
          <button
            type="button"
            onClick={startCamera}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer"
          >
            <Camera className="w-4 h-4" /> 카메라 스캔 시작
          </button>
        ) : (
          <button
            type="button"
            onClick={stopCamera}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 text-white text-sm font-medium cursor-pointer"
          >
            <Square className="w-4 h-4" /> 카메라 중지
          </button>
        )}

        <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-medium cursor-pointer hover:border-indigo-400">
          <Upload className="w-4 h-4 text-indigo-500" />
          이미지 파일로 스캔 (HTTP 지원)
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => e.target.files?.[0] && scanFile(e.target.files[0])}
          />
        </label>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 text-xs">
          {error}
        </div>
      )}

      <div id={containerId} className="max-w-md mx-auto rounded-xl overflow-hidden" />

      {result && (
        <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-500/30 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">스캔 결과</span>
            <CopyButton text={result} />
          </div>
          <div className="font-mono text-sm break-all">{result}</div>
        </div>
      )}
    </div>
  );
}
