import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { generateUuidV4, generateUuidV7, generateUlid, generateNanoId } from '../utils/helpers';

type IdType = 'uuidv4' | 'uuidv7' | 'ulid' | 'nanoid';

export default function UuidGenTool() {
  const [type, setType] = useState<IdType>('uuidv7');
  const [count, setCount] = useState(5);
  const [uppercase, setUppercase] = useState(false);
  const [noHyphen, setNoHyphen] = useState(false);
  const [ids, setIds] = useState<string[]>(() => Array.from({ length: 5 }, () => generateUuidV7()));

  const generate = (t = type, c = count, u = uppercase, nh = noHyphen) => {
    const gen = () => {
      let id =
        t === 'uuidv4'
          ? generateUuidV4()
          : t === 'uuidv7'
          ? generateUuidV7()
          : t === 'ulid'
          ? generateUlid()
          : generateNanoId(21);
      if (nh) id = id.replace(/-/g, '');
      if (u) id = id.toUpperCase();
      return id;
    };
    setIds(Array.from({ length: c }, gen));
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        {(
          [
            ['uuidv4', 'UUID v4 (랜덤)'],
            ['uuidv7', 'UUID v7 (시간순)'],
            ['ulid', 'ULID'],
            ['nanoid', 'NanoID (21자)'],
          ] as [IdType, string][]
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setType(t);
              generate(t, count, uppercase, noHyphen);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
              type === t ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
            }`}
          >
            {label}
          </button>
        ))}

        <select
          value={count}
          onChange={(e) => {
            const c = Number(e.target.value);
            setCount(c);
            generate(type, c, uppercase, noHyphen);
          }}
          className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs"
        >
          {[1, 5, 10, 20, 50, 100].map((c) => (
            <option key={c} value={c}>{c}개</option>
          ))}
        </select>

        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(e) => {
              setUppercase(e.target.checked);
              generate(type, count, e.target.checked, noHyphen);
            }}
          />
          대문자
        </label>

        <label className="flex items-center gap-1.5 text-xs">
          <input
            type="checkbox"
            checked={noHyphen}
            onChange={(e) => {
              setNoHyphen(e.target.checked);
              generate(type, count, uppercase, e.target.checked);
            }}
          />
          하이픈 제거
        </label>

        <div className="ml-auto flex gap-2">
          <button
            type="button"
            onClick={() => generate()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> 새로 생성
          </button>
          <CopyButton text={ids.join('\n')} label="전체 복사" />
        </div>
      </div>

      <div className="space-y-1.5">
        {ids.map((id, idx) => (
          <div
            key={`${id}-${idx}`}
            className="flex items-center justify-between gap-2 px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 font-mono text-xs"
          >
            <span className="break-all">{id}</span>
            <CopyButton text={id} />
          </div>
        ))}
      </div>
    </div>
  );
}
