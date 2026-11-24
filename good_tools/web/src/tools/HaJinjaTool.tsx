import { HaIntegration } from '../components/HaIntegration';
import { useState } from 'react';
import { CopyButton } from '../components/CopyButton';

const SNIPPETS = [
  {
    category: '상태 조회',
    title: '켜져 있는 조명 개수 세기',
    code: `{{ states.light | selectattr('state', 'eq', 'on') | list | count }}`,
  },
  {
    category: '상태 조회',
    title: '특정 영역(Area) 내 켜진 조명 이름 목록',
    code: `{{ area_entities('거실') | select('match', '^light\\.') | select('is_state', 'on') | map('state_attr', 'friendly_name') | join(', ') }}`,
  },
  {
    category: '배터리·점검',
    title: '배터리 20% 미만 센서 목록',
    code: `{% for s in states.sensor if s.attributes.device_class == 'battery' and s.state | is_number and s.state | float < 20 %}\n- {{ s.name }}: {{ s.state }}%\n{% endfor %}`,
  },
  {
    category: '배터리·점검',
    title: 'unavailable 상태 엔티티 목록',
    code: `{{ states | selectattr('state', 'in', ['unavailable', 'unknown']) | map(attribute='entity_id') | list | join('\\n') }}`,
  },
  {
    category: '시간·날짜',
    title: '한국어 요일 포함 현재 시각',
    code: `{% set days = ['월','화','수','목','금','토','일'] %}{{ now().strftime('%Y-%m-%d') }} ({{ days[now().weekday()] }}) {{ now().strftime('%H:%M') }}`,
  },
  {
    category: '시간·날짜',
    title: '특정 엔티티 마지막 변경 후 경과 시간(분)',
    code: `{{ ((now() - states.binary_sensor.front_door.last_changed).total_seconds() / 60) | round(1) }}분 전`,
  },
  {
    category: '숫자·포맷',
    title: '천 단위 콤마 포맷 (전력요금/금액)',
    code: `{{ '{:,.0f}'.format(states('sensor.monthly_cost') | float(0)) }}원`,
  },
  {
    category: '알림 메시지',
    title: '열려 있는 문/창문 요약 알림',
    code: `{% set open = states.binary_sensor | selectattr('attributes.device_class', 'in', ['door', 'window']) | selectattr('state', 'eq', 'on') | map(attribute='name') | list %}\n{% if open %}열려 있음: {{ open | join(', ') }}{% else %}모든 문과 창문이 닫혀 있습니다.{% endif %}`,
  },
];

export default function HaJinjaTool() {
  const [search, setSearch] = useState('');
  const [cat, setCat] = useState('전체');

  const categories = ['전체', ...Array.from(new Set(SNIPPETS.map((s) => s.category)))];
  const filtered = SNIPPETS.filter((s) => {
    if (cat !== '전체' && s.category !== cat) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return s.title.toLowerCase().includes(q) || s.code.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-4">
      <HaIntegration evaluate />
      <div className="flex flex-wrap items-center gap-2">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="템플릿 검색 (예: 배터리, 조명, 요일, unavailable)..."
          className="flex-1 min-w-[200px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm"
        />
        <div className="flex flex-wrap gap-1.5">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCat(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer ${
                cat === c ? 'bg-indigo-600 text-white' : 'bg-slate-100 dark:bg-slate-800'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((s) => (
          <div key={s.title} className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-sky-500/15 text-sky-600 dark:text-sky-300">
                  {s.category}
                </span>
                <span className="font-semibold text-sm">{s.title}</span>
              </div>
              <CopyButton text={s.code} />
            </div>
            <pre className="p-3 rounded-lg bg-slate-950 text-cyan-300 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {s.code}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}
