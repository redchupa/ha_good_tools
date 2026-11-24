import { useEffect, useState } from 'react';
import { RefreshCw, Search } from 'lucide-react';
import { CopyButton } from '../components/CopyButton';
import { calculateSubnet } from '../utils/helpers';

export default function IpInfoTool() {
  const [ipData, setIpData] = useState<any>(null);
  const [loadingIp, setLoadingIp] = useState(false);
  const [domain, setDomain] = useState('home-assistant.io');
  const [dnsRes, setDnsRes] = useState<any>(null);
  const [dnsErr, setDnsErr] = useState('');

  const [subIp, setSubIp] = useState('192.168.1.129');
  const [prefix, setPrefix] = useState(24);

  const loadIp = async () => {
    setLoadingIp(true);
    try {
      const r = await fetch('./api/ipinfo');
      setIpData(await r.json());
    } finally {
      setLoadingIp(false);
    }
  };

  useEffect(() => {
    loadIp();
  }, []);

  const lookupDns = async (e: React.FormEvent) => {
    e.preventDefault();
    setDnsErr('');
    const r = await fetch('./api/dns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ domain }),
    });
    const d = await r.json();
    if (!r.ok) setDnsErr(d.error || 'DNS 조회 실패');
    else setDnsRes(d);
  };

  let subnet: ReturnType<typeof calculateSubnet> | null = null;
  let subnetErr = '';
  try {
    subnet = calculateSubnet(subIp, prefix);
  } catch (e) {
    subnetErr = e instanceof Error ? e.message : '계산 오류';
  }

  return (
    <div className="space-y-6">
      {/* Public IP Card */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">공인 IP & 접속 정보</h2>
          <button
            type="button"
            onClick={loadIp}
            disabled={loadingIp}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingIp ? 'animate-spin' : ''}`} /> 새로고침
          </button>
        </div>
        {ipData?.publicInfo ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200 dark:border-indigo-500/30">
              <div className="text-[11px] text-indigo-600 dark:text-indigo-300">공인 IP</div>
              <div className="flex items-center justify-between mt-1">
                <span className="font-mono font-bold text-base">{ipData.publicInfo.ip}</span>
                <CopyButton text={ipData.publicInfo.ip} />
              </div>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700">
              <div className="text-[11px] text-slate-500">위치</div>
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
              <div className="text-[11px] text-slate-500">클라이언트(내부) IP</div>
              <div className="font-mono text-sm mt-1">{ipData.clientIp}</div>
            </div>
          </div>
        ) : (
          <div className="text-xs text-slate-500">IP 정보를 불러오는 중이거나 네트워크 도구가 비활성화되어 있습니다.</div>
        )}
      </section>

      {/* DNS Lookup */}
      <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold">DNS 레코드 조회</h2>
        <form onSubmit={lookupDns} className="flex gap-2">
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            placeholder="도메인 입력 (예: google.com)"
            className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-mono"
          />
          <button type="submit" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium cursor-pointer">
            <Search className="w-4 h-4" /> 조회
          </button>
        </form>
        {dnsErr && <div className="text-xs text-rose-500">{dnsErr}</div>}
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
                  <span className="text-slate-400">레코드 없음</span>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* CIDR Subnet Calculator */}
      <section className="space-y-3 pt-4 border-t border-slate-200 dark:border-slate-800">
        <h2 className="text-sm font-semibold">CIDR 서브넷 계산기</h2>
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
        {subnetErr && <div className="text-xs text-rose-500">{subnetErr}</div>}
        {subnet && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
            {[
              ['CIDR', subnet.cidr],
              ['서브넷 마스크', subnet.netmask],
              ['네트워크 주소', subnet.network],
              ['브로드캐스트', subnet.broadcast],
              ['첫 번째 호스트', subnet.firstHost],
              ['마지막 호스트', subnet.lastHost],
              ['사용 가능 호스트', subnet.usableHosts.toLocaleString()],
              ['와일드카드 마스크', subnet.wildcard],
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
