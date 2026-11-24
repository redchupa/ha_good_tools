import { useEffect, useState } from 'react';
import { ArrowLeftRight, RotateCcw, Edit3 } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';

interface CurrencyDef {
  code: string;
  name: string;
  symbol: string;
  flag: string;
  unit: number; // 1 for most, 100 for JPY & VND
  defaultKrwPerUnit: number; // illustrative KRW per `unit`
}

// 예시 기본 환율 (실제 환율로 사용자가 자유롭게 수정 가능)
const DEFAULT_CURRENCIES: CurrencyDef[] = [
  { code: 'KRW', name: '대한민국 원', symbol: '₩', flag: '🇰🇷', unit: 1, defaultKrwPerUnit: 1 },
  { code: 'USD', name: '미국 달러', symbol: '$', flag: '🇺🇸', unit: 1, defaultKrwPerUnit: 1415 },
  { code: 'JPY', name: '일본 엔 (100엔)', symbol: '¥', flag: '🇯🇵', unit: 100, defaultKrwPerUnit: 875 },
  { code: 'EUR', name: '유럽 유로', symbol: '€', flag: '🇪🇺', unit: 1, defaultKrwPerUnit: 1495 },
  { code: 'CNY', name: '중국 위안', symbol: '¥', flag: '🇨🇳', unit: 1, defaultKrwPerUnit: 204 },
  { code: 'GBP', name: '영국 파운드', symbol: '£', flag: '🇬🇧', unit: 1, defaultKrwPerUnit: 1780 },
  { code: 'AUD', name: '호주 달러', symbol: 'A$', flag: '🇦🇺', unit: 1, defaultKrwPerUnit: 920 },
  { code: 'CAD', name: '캐나다 달러', symbol: 'C$', flag: '🇨🇦', unit: 1, defaultKrwPerUnit: 1015 },
  { code: 'SGD', name: '싱가포르 달러', symbol: 'S$', flag: '🇸🇬', unit: 1, defaultKrwPerUnit: 1055 },
  { code: 'HKD', name: '홍콩 달러', symbol: 'HK$', flag: '🇭🇰', unit: 1, defaultKrwPerUnit: 182 },
  { code: 'TWD', name: '대만 달러', symbol: 'NT$', flag: '🇹🇼', unit: 1, defaultKrwPerUnit: 43.5 },
  { code: 'THB', name: '태국 바트', symbol: '฿', flag: '🇹🇭', unit: 1, defaultKrwPerUnit: 41.5 },
  { code: 'VND', name: '베트남 동 (100동)', symbol: '₫', flag: '🇻🇳', unit: 100, defaultKrwPerUnit: 5.6 },
  { code: 'PHP', name: '필리핀 페소', symbol: '₱', flag: '🇵🇭', unit: 1, defaultKrwPerUnit: 24.5 },
  { code: 'CHF', name: '스위스 프랑', symbol: 'CHF', flag: '🇨🇭', unit: 1, defaultKrwPerUnit: 1590 },
];

const LS_KEY = 'good_tools_currency_rates_2026';

export default function CurrencyCalcTool() {
  const [rates, setRates] = useState<Record<string, number>>(() => {
    const base = Object.fromEntries(DEFAULT_CURRENCIES.map((c) => [c.code, c.defaultKrwPerUnit]));
    try {
      const saved = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      return { ...base, ...saved };
    } catch {
      return base;
    }
  });

  const [sources, setSources] = useState<Record<string,string>>(() => {
    try { return JSON.parse(localStorage.getItem(LS_KEY + '_sources') || '{}') || {}; } catch { return {}; }
  });
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);
  const refresh = async () => {
    setLoading(true);
    try {
      const r = await fetch('./api/exchange-rates');
      if (!r.ok) throw Error();
      const feed = await r.json();
      const values: Record<string,number> = {};
      const labels: Record<string,string> = {};
      for (const c of DEFAULT_CURRENCIES) {
        const rate = feed.rates[c.code];
        if (Number.isFinite(rate) && rate > 0) {
          values[c.code] = c.unit / rate;
          labels[c.code] = feed.source + ' · ' + feed.date;
        }
      }
      setRates(prev=>({...prev,...values}));
      setSources(prev=>({...prev,...labels}));
      // The ECB reference feed does not publish every currency (for example TWD and VND).
      const missing = DEFAULT_CURRENCIES.filter(c => c.code !== 'KRW' && !(c.code in values)).map(c => c.code);
      const total = DEFAULT_CURRENCIES.length - 1;
      setStatus(missing.length
        ? `${total - missing.length}/${total}개 갱신 (${feed.date}) · ${missing.join('·')}는 출처에 없어 직접 입력해 주세요 / ${missing.join(', ')} not in the feed`
        : `${total}개 모두 갱신 (${feed.date}) / All updated`);
    } catch { setStatus('갱신 실패 · 저장된 환율 사용 / Using cached rates'); }
    finally { setLoading(false); }
  };
  const edit = (code:string, value:string) => {
    const n = Number(value);
    if (n > 0 && Number.isFinite(n)) {
      setRates(prev=>({...prev,[code]:n}));
      setSources(prev=>({...prev,[code]:'사용자 입력 / Manual · ' + new Date().toLocaleDateString()}));
    }
  };
  const describe = (code:string) => sources[code] || (rates[code] === DEFAULT_CURRENCIES.find(c=>c.code===code)?.defaultKrwPerUnit ? '예시 / Example' : '저장값 / Saved');
  const [fromCode, setFromCode] = useState('USD');
  const [toCode, setToCode] = useState('KRW');
  const [amount, setAmount] = useState('100');
  const [editRates, setEditRates] = useState(false);

  useEffect(() => {
    localStorage.setItem(LS_KEY, JSON.stringify(rates));
    localStorage.setItem(LS_KEY + '_sources',JSON.stringify(sources));
  }, [rates,sources]);

  const getKrwPerOne = (code: string) => {
    const def = DEFAULT_CURRENCIES.find((c) => c.code === code)!;
    const raw = Number(rates[code]);
    const rate = Number.isFinite(raw) && raw > 0 ? raw : def.defaultKrwPerUnit;
    return rate / def.unit;
  };

  const numAmount = parseFloat(amount) || 0;
  const amountInKrw = numAmount * getKrwPerOne(fromCode);
  const convertedValue = amountInKrw / getKrwPerOne(toCode);

  const fromDef = DEFAULT_CURRENCIES.find((c) => c.code === fromCode)!;
  const toDef = DEFAULT_CURRENCIES.find((c) => c.code === toCode)!;

  const swap = () => {
    setFromCode(toCode);
    setToCode(fromCode);
  };

  const resetDefaults = () => {
    const base = Object.fromEntries(DEFAULT_CURRENCIES.map((c) => [c.code, c.defaultKrwPerUnit]));
    setRates(base); setSources({});
  };

  const fmt = (val: number, code: string) =>
    val.toLocaleString('ko-KR', { maximumFractionDigits: code === 'KRW' || code === 'JPY' || code === 'VND' ? 0 : 2 });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
        <span>기본값은 예시 환율 기준이며, 실제 환율을 직접 수정해 계산할 수 있습니다.</span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setEditRates((e) => !e)}
            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border font-medium cursor-pointer ${
              editRates
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> {editRates ? '환율 편집 닫기' : '환율 직접 수정'}
          </button>
          <button
            type="button"
            onClick={resetDefaults}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> 예시값 복원
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 text-sm"><button disabled={loading} onClick={refresh}>기준 환율 갱신 / Refresh</button>
        <span>{fromCode} · {describe(fromCode)} / {toCode} · {describe(toCode)}</span><span role="status">{status}</span></div>
      {/* Main 1:1 Converter */}
      <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-end">
          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">보내는 통화</label>
            <div className="flex gap-2">
              <select
                value={fromCode}
                onChange={(e) => setFromCode(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                {DEFAULT_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.name})
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="flex-1 min-w-[100px] px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono text-base font-bold"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={swap}
            className="h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 hover:bg-indigo-50 dark:hover:bg-indigo-500/20 flex items-center justify-center cursor-pointer"
            title="통화 바꾸기"
          >
            <ArrowLeftRight className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </button>

          <div className="space-y-1.5">
            <label className="text-xs text-slate-500">변환 결과</label>
            <div className="flex gap-2">
              <select
                value={toCode}
                onChange={(e) => setToCode(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-medium"
              >
                {DEFAULT_CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>
                    {c.flag} {c.code} ({c.name})
                  </option>
                ))}
              </select>
              <div className="flex-1 px-3.5 py-2.5 rounded-xl border border-indigo-300 dark:border-indigo-500/40 bg-indigo-50/60 dark:bg-indigo-500/15 font-mono text-base font-extrabold text-indigo-700 dark:text-indigo-300 flex items-center justify-between gap-2">
                <span className="truncate">
                  {toDef.symbol} {fmt(convertedValue, toCode)}
                </span>
                <CopyButton text={fmt(convertedValue, toCode)} />
              </div>
            </div>
          </div>
        </div>

        {/* Inline quick rate edit for selected pair */}
        {fromCode !== 'KRW' && (
          <div className="flex flex-wrap items-center gap-2 text-xs pt-2 border-t border-slate-200 dark:border-slate-700">
            <span className="text-slate-500">
              적용 환율 ({fromDef.unit} {fromCode} 기준 원화):
            </span>
            <input
              type="number"
              step="0.1"
              value={rates[fromCode]}
              onChange={(e) => edit(fromCode,e.target.value)}
              className="w-28 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-mono font-semibold"
            />
            <span>원</span>
          </div>
        )}
      </div>

      {/* Rate Editor Table */}
      {editRates && (
        <div className="p-4 rounded-2xl border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50/30 dark:bg-indigo-500/5 space-y-3">
          <div className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
            통화별 기준 환율 직접 편집 (원화 KRW 기준)
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {DEFAULT_CURRENCIES.filter((c) => c.code !== 'KRW').map((c) => (
              <label key={c.code} className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs">
                <span>
                  {c.flag} <strong>{c.code}</strong> ({c.unit}단위)
                </span>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    step="0.1"
                    value={rates[c.code]}
                    onChange={(e) =>
                      edit(c.code,e.target.value)
                    }
                    className="w-24 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-right"
                  />
                  <span className="text-slate-400">원</span>
                </div>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Multi-currency comparison grid */}
      <div className="space-y-2">
        <div className="text-xs font-semibold text-slate-500">
          전체 주요 국가 동시 환산 ({fromDef.flag} {fmt(numAmount, fromCode)} {fromCode} 기준)
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {DEFAULT_CURRENCIES.map((c) => {
            const val = amountInKrw / getKrwPerOne(c.code);
            return (
              <button
                key={c.code}
                type="button"
                onClick={() => setToCode(c.code)}
                className={`p-3 rounded-xl border text-left transition-colors cursor-pointer ${
                  c.code === toCode
                    ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-500/15'
                    : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 hover:border-indigo-400'
                }`}
              >
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>{c.flag} {c.code}</span>
                  {c.code !== 'KRW' && (
                    <span className="text-[10px] font-mono opacity-75">
                      {rates[c.code]}원/{c.unit}
                    </span>
                  )}
                </div>
                <div className="font-mono font-bold text-sm mt-1 truncate">
                  {c.symbol} {fmt(val, c.code)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
