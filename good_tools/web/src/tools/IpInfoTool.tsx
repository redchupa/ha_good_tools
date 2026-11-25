import { LookupNotice, checkLookupLimit } from '../components/LookupNotice';
import { Diagnostic } from '../components/Diagnostic';
import { useText } from '../hooks/language';
import { useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { calculateSubnet } from '../utils/helpers';

export default function IpInfoTool() {
  const ui = useText();
  const [ipData, setIpData] = useState<any>(null);
  const [loadingIp, setLoadingIp] = useState(false);
  const [ipError, setIpError] = useState('');
  const [domain, setDomain] = useState('home-assistant.io');
  const [dnsRes, setDnsRes] = useState<any>(null);
  const [loadingDns, setLoadingDns] = useState(false);
  const [dnsErr, setDnsErr] = useState('');

  const [subIp, setSubIp] = useState('192.168.1.129');
  const [prefix, setPrefix] = useState(24);

  const loadIp = async () => {
    setIpError('');
    setLoadingIp(true);
    try {
      const r = await fetch('./api/ipinfo');
      checkLookupLimit(r, ui);
      const data = await r.json();
      if (!r.ok || !data.publicInfo) throw Error(data.error || ui('공인 IP를 조회하지 못했습니다.', 'Could not look up your public IP.'));
      setIpData(data);
    } catch (err) {
      setIpError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingIp(false);
    }
  };


  const lookupDns = async (e: React.FormEvent) => {
    e.preventDefault();
    setDnsErr('');
    setDnsRes(null);
    setLoadingDns(true);
    try {
      const r = await fetch('./api/dns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain }),
      });
      checkLookupLimit(r, ui);
      const d = await r.json();
      if (!r.ok) setDnsErr(d.error || ui('DNS 조회 실패', "DNS lookup failed"));
      else setDnsRes(d);
    } catch (err) {
      setDnsErr(err instanceof Error ? err.message : String(err));
    } finally {
      setLoadingDns(false);
    }
  };

  let subnet: ReturnType<typeof calculateSubnet> | null = null;
  let subnetErr = '';
  try {
    subnet = calculateSubnet(subIp, prefix);
  } catch (e) {
    subnetErr = e instanceof Error ? e.message : ui('계산 오류', "Calculation failed");
  }

  return (
    <div className="space-y-6">
      {/* Public IP Card */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">{ui("공인 IP & 접속 정보", "Public IP and connection details")}</h2>
          <button
            type="button"
            onClick={loadIp}
            disabled={loadingIp}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIp ? 'animate-spin' : ''}`} /> {loadingIp ? ui('조회 중…', 'Looking up…') : ui('공인 IP 조회', 'Look up public IP')}
          </button>
        </div>
        <LookupNotice pending={loadingIp} cache={ui("공인 IP 정보는 최대 15분 동안 저장된 값을 사용합니다.", "Public IP details are cached for up to 15 minutes.")} />
        {ipError && <p role="alert"><Diagnostic text={ipError} /></p>}
        {ipData?.publicInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30">
              <div className="text-[11px] text-indigo-600 dark:text-indigo-300">{ui("공인 IP", "Public IP")}</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-base">{ipData.publicInfo.ip}</span>
                <CopyButton text={ipData.publicInfo.ip} />
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500">{ui("위치", "Location")}</div>
              <div className="font-semibold text-sm mt-1">
                {[ipData.publicInfo.country, ipData.publicInfo.city].filter(Boolean).join(' · ') || '-'}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500">ISP / ASN</div>
              <div className="font-semibold text-sm mt-1 truncate">
                {ipData.publicInfo.isp || '-'} {ipData.publicInfo.asn}
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500">{ui("클라이언트(내부) IP", "Client (internal) IP")}</div>
              <div className="font-mono text-sm mt-1">{ipData.clientIp}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">{ui('버튼을 누르면 외부 서비스에서 공인 IP를 조회합니다.', 'Use the button to look up your public IP with an external service.')}</div>
        )}
      </section>

      {/* DNS Lookup */}
      <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold">{ui("DNS 레코드 조회", "DNS record lookup")}</h2>
        <LookupNotice pending={loadingDns} />
        <form onSubmit={lookupDns} className="flex gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder={ui("도메인 입력 (예: google.com)", "Enter a domain (e.g. google.com)")}
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
          />
          <button disabled={loadingDns} type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium cursor-pointer">
            <Search className="w-4 h-4" /> {ui("조회", "Look up")}
          </button>
        </form>
        {dnsErr && <div className="text-xs text-rose-500"><Diagnostic text={dnsErr} /></div>}
        {dnsRes && <p className="text-sm font-semibold">{dnsRes.domain}</p>}
        {dnsRes && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {Object.entries(dnsRes.records).map(([type, vals]: [string, any]) => (
              <div key={type} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="font-bold text-indigo-600 dark:text-indigo-400 mb-1">{type}</div>
                {Array.isArray(vals) && vals.length > 0 ? (
                  <ul className="font-mono space-y-0.5 break-all">
                    {vals.map((v, i) => (
                      <li key={i}>{typeof v === 'string' ? v : `${v.priority} ${v.exchange}`}</li>
                    ))}
                  </ul>
                ) : (
                  <span className={dnsRes.failedTypes?.includes(type) ? "text-amber-600 dark:text-amber-400" : "text-slate-400"}>{dnsRes.failedTypes?.includes(type) ? ui("조회 실패 · 잠시 후 다시 시도해 주세요.", "Lookup failed. Try again shortly.") : ui("레코드 없음", "No records")}</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CIDR Subnet Calculator */}
      <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold">{ui("CIDR 서브넷 계산기", "CIDR subnet calculator")}</h2>
        <div className="flex flex-wrap items-center gap-2">
          <input
            value={subIp}
            onChange={(e) => setSubIp(e.target.value)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
          />
          <span className="font-mono font-bold">/</span>
          <input
            type="number"
            min={0}
            max={32}
            value={prefix}
            onChange={(e) => setPrefix(Math.min(32, Math.max(0, Number(e.target.value) || 0)))}
            className="w-20 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
          />
        </div>
        {subnetErr && <div className="text-xs text-rose-500"><Diagnostic text={subnetErr} /></div>}
        {subnet && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              ['CIDR', subnet.cidr],
              [ui('서브넷 마스크', "Subnet mask"), subnet.netmask],
              [ui('네트워크 주소', "Network address"), subnet.network],
              [ui('브로드캐스트', "Broadcast"), subnet.broadcast],
              [ui('첫 번째 호스트', "First host"), subnet.firstHost],
              [ui('마지막 호스트', "Last host"), subnet.lastHost],
              [ui('사용 가능 호스트', "Usable hosts"), subnet.usableHosts.toLocaleString()],
              [ui('와일드카드 마스크', "Wildcard mask"), subnet.wildcard],
            ].map(([k, v]) => (
              <div key={k} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                <div className="text-slate-500">{k}</div>
                <div className="font-mono font-semibold mt-0.5">{v}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
