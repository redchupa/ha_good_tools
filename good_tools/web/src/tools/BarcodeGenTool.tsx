import { useText } from '../hooks/language';
import { downloadBlob } from '../utils/download';
import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { Download } from 'lucide-react';

export default function BarcodeGenTool() {
  const ui = useText();
  const [tab, setTab] = useState<'qr' | 'barcode'>('qr');
  const [qrMode, setQrMode] = useState<'text' | 'wifi'>('text');
  const [qrText, setQrText] = useState('https://www.home-assistant.io');
  const [wifiSsid, setWifiSsid] = useState('');
  const [wifiPass, setWifiPass] = useState('');
  const [wifiEnc, setWifiEnc] = useState<'WPA' | 'WEP' | 'nopass'>('WPA');
  const [qrDataUrl, setQrDataUrl] = useState('');

  const [bcValue, setBcValue] = useState('GOODTOOLS-2026');
  const [bcFormat, setBcFormat] = useState('CODE128');
  const [bcError, setBcError] = useState('');
  const svgRef = useRef<SVGSVGElement>(null);

  const effectiveQr =
    qrMode === 'wifi'
      ? `WIFI:T:${wifiEnc};S:${wifiSsid};P:${wifiPass};;`
      : qrText;

  useEffect(() => {
    if (tab !== 'qr' || !effectiveQr.trim()) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(effectiveQr, { width: 320, margin: 2 })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [tab, effectiveQr]);

  useEffect(() => {
    if (tab !== 'barcode' || !svgRef.current) return;
    try {
      JsBarcode(svgRef.current, bcValue || ' ', {
        format: bcFormat,
        lineColor: '#0f172a',
        background: '#ffffff',
        width: 2,
        height: 90,
        displayValue: true,
      });
      setBcError('');
    } catch (err) {
      setBcError(err instanceof Error ? err.message : ui('해당 바코드 형식에 맞지 않는 값입니다.', "The value is invalid for this barcode format."));
    }
  }, [tab, bcValue, bcFormat]);

  const downloadBarcodeSvg = () => {
    if (!svgRef.current) return;
    const xml = new XMLSerializer().serializeToString(svgRef.current);
    const blob = new Blob([xml], { type: 'image/svg+xml' });
    downloadBlob(blob, `barcode-${bcFormat}.svg`);
  };

  return (
    <div className="space-y-5">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setTab('qr')}
          className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${
            tab === 'qr' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {ui("QR 코드 생성", "Generate QR code")}
        </button>
        <button
          type="button"
          onClick={() => setTab('barcode')}
          className={`px-4 py-2 rounded-xl text-sm font-medium cursor-pointer ${
            tab === 'barcode' ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
          }`}
        >
          {ui("1D 바코드 생성", "Generate barcode")}
        </button>
      </div>

      {tab === 'qr' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          <div className="space-y-4">
            <div className="flex gap-2 text-xs">
              <button
                type="button"
                onClick={() => setQrMode('text')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                  qrMode === 'text' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {ui("URL / 텍스트", "URL / text")}
              </button>
              <button
                type="button"
                onClick={() => setQrMode('wifi')}
                className={`px-3 py-1.5 rounded-lg font-medium cursor-pointer ${
                  qrMode === 'wifi' ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 dark:bg-slate-800'
                }`}
              >
                {ui("Wi-Fi 자동 연결 QR", "Wi-Fi connection QR")}
              </button>
            </div>

            {qrMode === 'text' ? (
              <textarea
                rows={4}
                value={qrText}
                onChange={(e) => setQrText(e.target.value)}
                placeholder={ui("URL 또는 텍스트를 입력하세요...", "Enter a URL or text...")}
                className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm outline-none focus:border-indigo-500"
              />
            ) : (
              <div className="space-y-3">
                <input
                  value={wifiSsid}
                  onChange={(e) => setWifiSsid(e.target.value)}
                  placeholder={ui("Wi-Fi 이름 (SSID)", "Wi-Fi network (SSID)")}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
                <input
                  value={wifiPass}
                  onChange={(e) => setWifiPass(e.target.value)}
                  placeholder={ui("비밀번호", "Password")}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                />
                <select
                  value={wifiEnc}
                  onChange={(e) => setWifiEnc(e.target.value as 'WPA' | 'WEP' | 'nopass')}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
                >
                  <option value="WPA">WPA / WPA2 / WPA3</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">{ui("암호 없음", "No password")}</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 gap-4">
            {qrDataUrl ? (
              <>
                <img src={qrDataUrl} alt="QR Code" className="w-56 h-56 rounded-xl bg-white p-2 shadow-sm" />
                <a
                  href={qrDataUrl}
                  download="qrcode.png"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium"
                >
                  <Download className="w-4 h-4" /> {ui("PNG 다운로드", "Download PNG")}
                </a>
              </>
            ) : (
              <div className="text-sm text-slate-400 py-16">{ui("내용을 입력하면 QR코드가 생성됩니다.", "Enter text to generate a QR code.")}</div>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              value={bcValue}
              onChange={(e) => setBcValue(e.target.value)}
              placeholder={ui("바코드 값 입력", "Barcode value")}
              className="sm:col-span-2 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
            />
            <select
              value={bcFormat}
              onChange={(e) => setBcFormat(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
            >
              <option value="CODE128">{ui("CODE128 (범용)", "CODE128 (general purpose)")}</option>
              <option value="EAN13">{ui("EAN-13 (13자리 숫자)", "EAN-13 (13 digits)")}</option>
              <option value="UPC">{ui("UPC (12자리 숫자)", "UPC (12 digits)")}</option>
              <option value="CODE39">CODE39</option>
              <option value="ITF14">ITF-14</option>
            </select>
          </div>

          {bcError && <div className="text-xs text-rose-500">{bcError}</div>}

          <div className="p-6 rounded-2xl bg-white border border-slate-200 flex flex-col items-center gap-4 overflow-x-auto">
            <svg ref={svgRef} />
            {!bcError && (
              <button
                type="button"
                onClick={downloadBarcodeSvg}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium cursor-pointer"
              >
                <Download className="w-4 h-4" /> {ui("SVG 다운로드", "Download SVG")}
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
