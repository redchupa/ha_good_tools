import { useContext } from 'react';
import { Language } from '../hooks/language';

// API and worker diagnostics are localized at the display boundary.
const messages: Record<string, string> = {
  "입력은 50만 자까지 지원합니다.": "Enter up to 500,000 characters.",
  "열 이름이 중복됩니다.": "Column names must be unique.",
  "열 개수가 일치하지 않습니다.": "Row and header column counts differ.",
  "따옴표 위치를 확인해 주세요.": "Check the placement of quotation marks.",
  "닫히지 않은 따옴표가 있습니다.": "A quoted field is missing its closing quote.",
  "올바른 IPv4 주소를 입력해 주세요.": "Enter a valid IPv4 address.",
  "올바른 IPv4 주소를 입력해 주세요 (예: 192.168.1.10)": "Enter a valid IPv4 address, such as 192.168.1.10.",
  "CIDR 프리픽스는 0~32 사이여야 합니다.": "The CIDR prefix must be between 0 and 32.",
  "문자열은 32,000자, 패턴은 1,024자, 치환식은 256자까지 입력해 주세요.": "Use at most 32,000 text characters, a 1,024-character pattern and a 256-character replacement.",
  "치환 결과가 너무 큽니다.": "The replacement result is too large.",
  "정규식 오류": "Invalid regular expression.",
  "앞으로 1년 안에 실행 시각이 없습니다.": "No scheduled runs in the next year.",
  "5개 필드의 범위, 목록 및 간격을 확인해 주세요.": "Check the ranges, lists and steps in all five fields.",
  "올바른 MAC 주소 형식이 아닙니다 (예: AA:BB:CC:DD:EE:FF)": "Enter a MAC address such as AA:BB:CC:DD:EE:FF.",
  "MAC 주소를 입력해 주세요.": "Enter a MAC address.",
  "브로드캐스트 주소는 올바른 IPv4 형식이어야 합니다.": "Enter a valid IPv4 broadcast address.",
  "포트는 1~65535 사이의 정수여야 합니다.": "Enter a whole-number port between 1 and 65535.",
  "올바른 호스트명 또는 IP 주소를 입력해 주세요.": "Enter a valid hostname or IP address.",
  "LAN의 사설 주소만 점검할 수 있습니다.": "Choose a private address on your LAN.",
  "도메인을 입력해 주세요.": "Enter a domain.",
  "올바른 포트 번호가 아닙니다.": "Invalid port number.",
  "서버에서 TLS 인증서를 반환하지 않았습니다.": "The server did not return a TLS certificate.",
  "TLS 연결 시간이 초과되었습니다.": "The TLS connection timed out.",
  "TLS 연결 오류": "TLS connection error.",
  "리다이렉트 횟수 제한을 초과했습니다.": "Too many redirects.",
  "요청을 처리할 수 없습니다.": "Could not process the request.",
  "네트워크 프록시 도구가 HA 애드온 설정(allow_network_tools)에서 비활성화되어 있습니다.": "Enable allow_network_tools in the HA app options.",
  "LAN 도구(WoL/포트 점검)가 HA 애드온 설정(allow_lan_tools)에서 비활성화되어 있습니다.": "Enable allow_lan_tools in the HA app options.",
  "요청이 많습니다. 잠시 후 다시 시도해 주세요.": "Too many requests. Try again shortly.",
  "변환할 URL을 입력해 주세요.": "Enter a URL to resolve.",
  "URL 추적 중 오류가 발생했습니다.": "URL tracing failed.",
  "조회할 도메인을 입력해 주세요.": "Enter a domain to look up.",
  "올바른 도메인 형식이 아닙니다.": "Invalid domain name.",
  "가져올 URL을 입력해 주세요.": "Enter a URL to fetch.",
  "HTML을 가져오는 중 오류가 발생했습니다.": "Could not fetch the HTML.",
  "RSS/Atom 피드 URL을 입력해 주세요.": "Enter an RSS or Atom feed URL.",
  "RSS 피드 파싱 중 오류가 발생했습니다.": "Could not read the feed.",
  "피드 이름과 URL을 모두 입력해 주세요.": "Enter a feed name and URL.",
  "http:// 또는 https:// URL만 저장할 수 있습니다.": "Use an HTTP or HTTPS URL.",
  "이름과 URL 길이를 확인해 주세요.": "Check the feed name and URL length.",
  "피드는 최대 200개까지 저장할 수 있습니다.": "You can save up to 200 feeds.",
  "피드 저장 실패": "Could not save the feed.",
  "저장할 내용을 입력해 주세요.": "Enter a note before saving.",
  "한 항목당 최대 20,000자까지 저장할 수 있습니다.": "Each note can contain up to 20,000 characters.",
  "WoL 패킷 전송 실패": "Could not send the Wake-on-LAN packet.",
  "포트 점검 오류": "Port check failed.",
  "SSL 진단 중 오류가 발생했습니다.": "Certificate check failed.",
  "올바른 URL 형식이 아닙니다.": "Invalid URL.",
  "http:// 또는 https:// 프로토콜만 허용됩니다.": "Only HTTP and HTTPS are supported.",
  "사용자 정보가 포함된 URL은 차단됩니다.": "URLs containing credentials are blocked.",
  "로컬 또는 내부 네트워크 주소는 보안상 차단됩니다.": "Local and internal network addresses are blocked.",
  "사설 IP 주소는 보안상 차단됩니다.": "Private IP addresses are blocked.",
  "사설 또는 내부 IP로 해석되는 주소는 보안상 차단됩니다.": "This hostname resolves to a private or internal address.",
  "프로토콜 전환은 지원하지 않습니다.": "Protocol upgrades are unsupported.",
  "서버 요청 처리 중 오류가 발생했습니다.": "The server could not process the request.",
};

import type { LangMode } from '../data/locales';

export function diagnosticText(text: string, lang: LangMode) {
  const nonKo = lang !== 'ko';
  if (nonKo && Object.hasOwn(messages, text)) return messages[text];
  // Older workers and HA servers send both languages in one diagnostic.
  const split = text.lastIndexOf(' / ');
  if (split >= 0) {
    const first = text.slice(0, split), second = text.slice(split + 3);
    const korean = /[가-힣]/;
    if (korean.test(first) !== korean.test(second)) {
      return korean.test(first) === (lang === 'ko') ? first : second;
    }
  }
  if (nonKo) return text
    .replace(/^피드 서버 응답 오류 /, 'Feed server error ')
    .replace(/^도메인 DNS 조회에 실패했습니다: /, 'DNS lookup failed for ')
    .replace(/^도메인 주소를 확인할 수 없습니다: /, 'Could not resolve ')
    .replace(/^응답 크기가 제한\((.*?)\)을 초과했습니다\.$/, 'The response exceeds $1.');
  return text;
}

export function Diagnostic({ text }: { text: string }) {
  return diagnosticText(text, useContext(Language));
}
