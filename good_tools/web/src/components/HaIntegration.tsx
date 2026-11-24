import { useEffect, useState } from 'react';
import { CopyButton } from './CopyButton';

export function useHaCapabilities() {
  const [caps, setCaps] = useState<{ templates: boolean; notify: boolean } | null>(null);
  useEffect(() => {
    const ctl = new AbortController();
    fetch('./api/ha/capabilities', { signal: ctl.signal }).then(async r => {
      if (r.ok) setCaps(await r.json());
    }).catch(() => {});
    return () => ctl.abort();
  }, []);
  return caps;
}
export function HaIntegration({ evaluate = false }: { evaluate?: boolean }) {
  const caps = useHaCapabilities();
  const [q,setQ] = useState('');
  const [ids,setIds] = useState<string[]>([]);
  const [template,setTemplate] = useState('');
  const [output,setOutput] = useState('');
  const [error,setError] = useState('');
  const [busy,setBusy] = useState(false);
  if (!caps) return null;
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
    <label>HA 엔티티 검색 / Entity search <input value={q} maxLength={80} onChange={e=>setQ(e.target.value)} /></label>
    <button disabled={busy || q.trim().length < 2} onClick={()=>run(true)}>검색 / Search</button>
    <ul>{ids.map(id=><li key={id}>{id} <CopyButton text={id} />
      {evaluate && caps.templates && <button onClick={()=>setTemplate("{{ states('" + id + "') }}")}>템플릿에 사용 / Insert</button>}</li>)}</ul>
    {evaluate && caps.templates && <><textarea aria-label="HA Jinja template" value={template} maxLength={2048} onChange={e=>setTemplate(e.target.value)} />
      <button disabled={busy || !template} onClick={()=>run(false)}>실행 / Evaluate</button><pre>{output}</pre></>}
    {error && <p role="alert">{error}</p>}
  </section>;
}
