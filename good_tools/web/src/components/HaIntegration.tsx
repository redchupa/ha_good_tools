import { useEffect, useState } from 'react';
import { CopyButton } from './CopyButton';
import { useText } from '../hooks/language';

type Caps = { templates: boolean; notify: boolean };
// caps is null until HA access is confirmed; userId is set when the signed-in person is not allowed.
export function useHaAccess() {
  const [access, setAccess] = useState<{ caps: Caps | null; userId: string }>({ caps: null, userId: '' });
  useEffect(() => {
    const ctl = new AbortController();
    fetch('./api/ha/capabilities', { signal: ctl.signal }).then(async r => {
      const data = await r.json().catch(() => ({}));
      if (r.ok) setAccess({ caps: data, userId: '' });
      else if (typeof data.userId === 'string') setAccess({ caps: null, userId: data.userId });
    }).catch(() => {});
    return () => ctl.abort();
  }, []);
  return access;
}
export function useHaCapabilities() {
  return useHaAccess().caps;
}

function HaOnboarding({ userId }: { userId: string }) {
  const t = useText();
  return <details className="rounded-xl border border-slate-200 dark:border-slate-700 p-3 text-xs">
    <summary className="cursor-pointer font-medium">{t('내 HA 엔티티를 검색하려면', 'Search your own HA entities')}</summary>
    <div className="mt-2 space-y-2 text-slate-600 dark:text-slate-300">
      <p>{t('관리자가 Good Tools 앱 설정의 ha_user_ids에 아래 사용자 ID를 추가하고 앱을 다시 시작하면 이 화면에서 엔티티 검색을 쓸 수 있습니다.',
        'Ask an administrator to add this user ID to ha_user_ids in the Good Tools app options and restart the app.')}</p>
      <div className="flex items-center gap-2"><code className="font-mono break-all">{userId}</code><CopyButton text={userId} /></div>
      <p className="text-slate-400">{t('설정 → 앱 → Good Tools → 구성', 'Settings → Apps → Good Tools → Configuration')}</p>
    </div>
  </details>;
}
export function HaIntegration({ evaluate = false }: { evaluate?: boolean }) {
  const t = useText();
  const { caps, userId } = useHaAccess();
  const [q,setQ] = useState('');
  const [ids,setIds] = useState<string[]>([]);
  const [template,setTemplate] = useState('');
  const [output,setOutput] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  if (!caps) return userId ? <HaOnboarding userId={userId} /> : null;
  const run = async (search: boolean) => {
    setBusy(true); setError('');
    try {
      const r = search ? await fetch('./api/ha/entities?q=' + encodeURIComponent(q)) :
        await fetch('./api/ha/template', { method: 'POST', headers: { 'Content-Type':'application/json' }, body:JSON.stringify({ template }) });
      if (!r.ok) throw Error(String(r.status));
      const data = await r.json();
      if (search) setIds(data.ids); else setOutput(data.result);
    } catch { setError('HA 요청 실패 / Check access and retry.'); }
    finally { setBusy(false); }
  };
  return <section className="space-y-2 rounded-xl border p-3">
    <label>{t('HA 엔티티 검색', 'Entity search')} <input value={q} maxLength={80} onChange={e=>setQ(e.target.value)} /></label>
    <button disabled={busy || q.trim().length < 2} onClick={()=>run(true)}>{t('검색', 'Search')}</button>
    <ul>{ids.map(id=><li key={id}>{id} <CopyButton text={id} />
      {evaluate && caps.templates && <button onClick={()=>setTemplate("{{ states('" + id + "') }}")}>{t('템플릿에 사용', 'Insert')}</button>}</li>)}</ul>
    {evaluate && caps.templates && <><textarea aria-label="HA Jinja template" value={template} maxLength={2048} onChange={e=>setTemplate(e.target.value)} />
      <button disabled={busy || !template} onClick={()=>run(false)}>{t('실행', 'Evaluate')}</button><pre>{output}</pre></>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
