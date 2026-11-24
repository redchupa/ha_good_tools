import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useState } from 'react';
import { Power, Radio, CheckCircle2, XCircle } from 'lucide-react';

export default function LanWolTool() {
  const ui = useText();
  const [host, setHost] = useState('192.168.1.1');
  const [port, setPort] = useState(80);
  const [portRes, setPortRes] = useState<any>(null);
  const [portLoading, setPortLoading] = useState(false);

  const [mac, setMac] = useState('');
  const [broadcastIp, setBroadcastIp] = useState('255.255.255.255');
  const [wolRes, setWolRes] = useState<string>('');
  const [wolErr, setWolErr] = useState<string>('');

  const checkPort = async (e: React.FormEvent) => {
    e.preventDefault();
    setPortLoading(true);
    setPortRes(null);
    try {
      const r = await fetch('./api/port-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ host, port }),
      });
      setPortRes(await r.json());
    } finally {
      setPortLoading(false);
    }
  };

  const sendWol = async (e: React.FormEvent) => {
    e.preventDefault();
    setWolRes('');
    setWolErr('');
    const r = await fetch('./api/wol', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mac, broadcastIp, port: 9 }),
    });
    const d = await r.json();
    if (!r.ok) setWolErr(d.error || ui('전송 실패', "Send failed"));
    else setWolRes(ui(`매직패킷 전송 완료 (${d.mac} → ${d.broadcastIp}:${d.port}, ${d.bytes} bytes)`, `Magic packet sent (${d.mac} → ${d.broadcastIp}:${d.port}, ${d.bytes} bytes)`));
  };

  return (
    <div className="space-y-6">
      {/* TCP Port Check */}
      <section className="space-y-3">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Radio className="w-4 h-4 text-indigo-500" /> {ui("LAN / 호스트 TCP 포트 연결 점검", "Check a LAN host or TCP port")}
        </h2>
        <form onSubmit={checkPort} className="flex flex-wrap gap-2">
          <input
            value={host}
            onChange={(e) => setHost(e.target.value)}
            placeholder={ui("IP 또는 호스트 (예: 192.168.1.1)", "IP address or host (e.g. 192.168.1.1)")}
            className="flex-1 min-w-[180px] px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
          />
          <input
            type="number"
            min={1}
            max={65535}
            value={port}
            onChange={(e) => setPort(Number(e.target.value))}
            className="w-28 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
          />
          <button
            type="submit"
            disabled={portLoading}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium disabled:opacity-40 cursor-pointer"
          >
            {portLoading ? ui('점검 중...', "Checking...") : ui('포트 점검', "Check port")}
          </button>
        </form>

        <div className="flex flex-wrap gap-1.5 text-xs">
          {[
            ['HTTP (80)', 80],
            ['HTTPS (443)', 443],
            ['SSH (22)', 22],
            ['MQTT (1883)', 1883],
            ['HA (8123)', 8123],
            ['SMB (445)', 445],
          ].map(([label, p]) => (
            <button
              key={label}
              type="button"
              onClick={() => setPort(Number(p))}
              className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 cursor-pointer"
            >
              {label}
            </button>
          ))}
        </div>

        {portRes && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2 ${
              portRes.error && portRes.open === undefined
                ? 'border-rose-400/40 bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300'
                : portRes.open
                ? 'border-emerald-400/40 bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                : 'border-amber-400/40 bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300'
            }`}
          >
            {portRes.open ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
            <span>
              {portRes.open === undefined
                ? portRes.error
                : portRes.open
                ? ui(`${portRes.host}:${portRes.port} 열림 (응답 ${portRes.latencyMs}ms)`, `${portRes.host}:${portRes.port} is open (${portRes.latencyMs} ms)`)
                : ui(`${portRes.host}:${portRes.port} 닫힘 또는 응답 없음 (${portRes.error || 'timeout'}, ${portRes.latencyMs}ms)`, `${portRes.host}:${portRes.port} is closed or unresponsive (${portRes.error ?? "timeout"}, ${portRes.latencyMs} ms)`)}
            </span>
          </div>
        )}
      </section>

      {/* Wake-on-LAN */}
      <section className="space-y-3 pt-5 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold flex items-center gap-1.5">
          <Power className="w-4 h-4 text-emerald-500" /> {ui("Wake-on-LAN (원격 PC 전원 켜기)", "Wake-on-LAN (wake a remote PC)")}
        </h2>
        <form onSubmit={sendWol} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            value={mac}
            onChange={(e) => setMac(e.target.value)}
            placeholder={ui("MAC 주소 (예: AA:BB:CC:DD:EE:FF)", "MAC address (e.g. AA:BB:CC:DD:EE:FF)")}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
          />
          <input
            value={broadcastIp}
            onChange={(e) => setBroadcastIp(e.target.value)}
            placeholder={ui("브로드캐스트 IP (기본 255.255.255.255)", "Broadcast IP (default 255.255.255.255)")}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-mono text-sm"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium cursor-pointer"
          >
            <Power className="w-4 h-4" /> {ui("WoL 패킷 전송", "Send WoL packet")}
          </button>
        </form>
        {wolRes && <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 text-xs">{wolRes}</div>}
        {wolErr && <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-500/15 text-rose-600 dark:text-rose-300 text-xs"><Diagnostic text={wolErr} /></div>}
      </section>
    </div>
  );
}
