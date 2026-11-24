export type ToolCategory = 'general' | 'developer' | 'feed';

export interface ToolMeta {
  id: string;
  name: string;
  shortDesc: string;
  category: ToolCategory;
  icon: string;
  keywords: string[];
  badge?: 'network' | 'https';
}

export const CATEGORY_LABELS: Record<ToolCategory, { label: string; desc: string }> = {
  general: { label: '일반 도구', desc: '일상·텍스트·이미지·미디어·생활 유틸리티 (19종)' },
  developer: { label: '개발자 도구', desc: '코드·인코딩·암호화·색상·네트워크 개발 유틸리티 (12종)' },
  feed: { label: '웹 / 피드', desc: 'RSS/Atom 피드 및 웹 게시글 리더 (1종)' },
};

export const TOOLS: ToolMeta[] = [
  // 일반 도구 (19종)
  {
    id: 'char-map',
    name: '특수문자표',
    shortDesc: '기호·이모지·화살표·수학·한글 자모 검색 및 원클릭 복사',
    category: 'general',
    icon: 'Hash',
    keywords: ['특수문자', '기호', '이모지', 'charmap', 'symbol', 'unicode'],
  },
  {
    id: 'ascii-art',
    name: '아스키아트 생성',
    shortDesc: '텍스트 배너 & 이미지를 아스키 아트로 변환',
    category: 'general',
    icon: 'Type',
    keywords: ['아스키아트', 'ascii', 'art', 'banner', 'figlet', '이미지'],
  },
  {
    id: 'gif-gen',
    name: 'GIF 생성기',
    shortDesc: '여러 장의 이미지를 합쳐 움직이는 애니메이션 GIF 제작',
    category: 'general',
    icon: 'Images',
    keywords: ['gif', '움짤', '애니메이션', '이미지', 'anigif'],
  },
  {
    id: 'barcode-gen',
    name: '바코드 & QR 생성기',
    shortDesc: 'CODE128·EAN13·UPC 바코드 및 URL/Wi-Fi QR코드 생성',
    category: 'general',
    icon: 'QrCode',
    keywords: ['바코드', 'qr', 'barcode', 'qrcode', 'wifi'],
  },
  {
    id: 'web-editor',
    name: '웹 에디터',
    shortDesc: 'Markdown & HTML 실시간 분할 미리보기 및 내보내기',
    category: 'general',
    icon: 'FileEdit',
    keywords: ['에디터', '마크다운', 'markdown', 'html', 'editor', '메모'],
  },
  {
    id: 'subtitle-conv',
    name: '자막 변환기 (SMI↔SRT)',
    shortDesc: 'SMI·SRT·VTT 자막 상호 변환, 인코딩 자동 감지, 싱크 조절',
    category: 'general',
    icon: 'Film',
    keywords: ['자막', 'smi', 'srt', 'vtt', '싱크', '변환'],
  },
  {
    id: 'char-counter',
    name: '글자수 세기',
    shortDesc: '공백 포함/제외 글자수, 단어, 줄, 바이트(UTF-8/EUC-KR) 실시간 계산',
    category: 'general',
    icon: 'AlignLeft',
    keywords: ['글자수', '바이트', '단어수', 'counter', '자소서'],
  },
  {
    id: 'eng-kor',
    name: '한영타 변환기',
    shortDesc: '영타로 잘못 친 한글(dkssud→안녕) 및 한글→영타 양방향 변환',
    category: 'general',
    icon: 'Languages',
    keywords: ['한영타', '두벌식', '오타', 'eng2kor', '한글'],
  },
  {
    id: 'magic-eye',
    name: '매직아이 생성기',
    shortDesc: '텍스트·3D 도형·깊이맵으로 오토스테레오그램 이미지 생성',
    category: 'general',
    icon: 'Eye',
    keywords: ['매직아이', '스테레오그램', 'magiceye', '3d'],
  },
  {
    id: 'tts',
    name: '문자 음성 변환 (TTS)',
    shortDesc: '텍스트를 브라우저 음성 합성과 속도/피치 조절로 읽어주기',
    category: 'general',
    icon: 'Volume2',
    keywords: ['tts', '음성', '읽기', 'speech', '발음'],
  },
  {
    id: 'eml-viewer',
    name: 'EML 뷰어',
    shortDesc: '.eml 이메일 파일 헤더·본문(HTML/텍스트)·첨부파일 안전 조회',
    category: 'general',
    icon: 'Mail',
    keywords: ['eml', '이메일', '메일', 'mime', '첨부파일'],
  },
  {
    id: 'long-url',
    name: '원주소 변환기',
    shortDesc: '단축 URL(bit.ly 등)의 리다이렉트 체인과 최종 목적지 안전 추적',
    category: 'general',
    icon: 'Link2',
    keywords: ['단축url', '원주소', 'unshorten', 'redirect', '링크'],
    badge: 'network',
  },
  {
    id: 'ip-info',
    name: 'IP / 네트워크 조회',
    shortDesc: '공인 IP·위치·ISP 조회, DNS 레코드 조회, CIDR 서브넷 계산기',
    category: 'general',
    icon: 'Globe',
    keywords: ['ip', '아이피', 'dns', '서브넷', 'cidr', 'ipconfig'],
    badge: 'network',
  },
  {
    id: 'lotto-gen',
    name: '로또 번호 생성기',
    shortDesc: '고정수/제외수 설정, 다중 게임 생성, 홀짝·합계 통계 분석',
    category: 'general',
    icon: 'Dices',
    keywords: ['로또', 'lotto', '번호', '추첨', '6/45'],
  },
  {
    id: 'flashlight',
    name: '화면 손전등',
    shortDesc: '전체화면 조명, 색온도/색상 프리셋, SOS/스트로브, 화면 꺼짐 방지',
    category: 'general',
    icon: 'Lightbulb',
    keywords: ['손전등', '플래시', '조명', 'sos', 'flashlight'],
  },
  {
    id: 'postcode',
    name: '우편번호 조회',
    shortDesc: '대한민국 도로명주소·지번주소·5자리 우편번호 검색 및 복사',
    category: 'general',
    icon: 'MapPin',
    keywords: ['우편번호', '주소', '도로명', 'postcode', '다음'],
    badge: 'network',
  },
  {
    id: 'barcode-scanner',
    name: '바코드 & QR 스캐너',
    shortDesc: '이미지 파일 업로드/붙여넣기 및 카메라 실시간 바코드·QR 스캔',
    category: 'general',
    icon: 'ScanLine',
    keywords: ['스캐너', '바코드', 'qr', '카메라', 'scanner'],
  },
  {
    id: 'file-checksum',
    name: '파일 체크섬 조회',
    shortDesc: '파일·텍스트 MD5, SHA-1, SHA-256, SHA-512, CRC32 계산 및 무결성 검증',
    category: 'general',
    icon: 'FileCheck',
    keywords: ['체크섬', '해시', 'md5', 'sha256', 'crc32', 'checksum'],
  },
  {
    id: 'stt',
    name: '음성 문자 변환 (STT)',
    shortDesc: '마이크 음성을 실시간 텍스트로 받아쓰기 (HTTPS 환경 지원)',
    category: 'general',
    icon: 'Mic',
    keywords: ['stt', '음성인식', '받아쓰기', '마이크', 'speech'],
    badge: 'https',
  },

  // 개발자 도구 (12종)
  {
    id: 'html-codes',
    name: 'HTML 코드표',
    shortDesc: 'HTML 특수문자 엔티티 검색 표 & 실시간 Escape/Unescape',
    category: 'developer',
    icon: 'Code2',
    keywords: ['html', 'entity', '엔티티', 'escape', '코드표'],
  },
  {
    id: 'ascii-codes',
    name: '아스키 코드표',
    shortDesc: '0~127 ASCII 전체 표(DEC/HEX/OCT/BIN) & 문자열↔ASCII 변환',
    category: 'developer',
    icon: 'Binary',
    keywords: ['ascii', '아스키', '코드표', 'hex', 'binary'],
  },
  {
    id: 'color-picker',
    name: '색상표 & 팔레트',
    shortDesc: 'HEX/RGB/HSL/CMYK 변환, WCAG 명암비 검사, Tailwind 팔레트',
    category: 'developer',
    icon: 'Palette',
    keywords: ['색상', '컬러', 'color', 'hex', 'rgb', 'wcag', '팔레트'],
  },
  {
    id: 'img-to-url',
    name: '이미지 ↔ Data URL',
    shortDesc: '이미지를 Base64 Data URL로 변환(리사이즈 지원) 및 역변환 미리보기',
    category: 'developer',
    icon: 'Image',
    keywords: ['이미지', 'base64', 'dataurl', 'img2url', '변환'],
  },
  {
    id: 'code-diff',
    name: '코드 / 문서 비교',
    shortDesc: '두 텍스트·코드의 차이점을 줄 단위로 비교 (Unified / Split)',
    category: 'developer',
    icon: 'GitCompare',
    keywords: ['비교', 'diff', 'compare', '코드비교', '문서비교'],
  },
  {
    id: 'code-beautify',
    name: '코드 정렬 (Beautify)',
    shortDesc: 'JSON, HTML, CSS, JS, SQL, XML, YAML 자동 포맷팅',
    category: 'developer',
    icon: 'Sparkles',
    keywords: ['정렬', '포맷', 'beautify', 'prettier', 'json', 'sql', 'yaml'],
  },
  {
    id: 'code-minify',
    name: '코드 압축 (Minify)',
    shortDesc: 'JSON, HTML, CSS, JS, SQL, XML 경량화 및 용량 절감률 확인',
    category: 'developer',
    icon: 'Minimize2',
    keywords: ['압축', 'minify', '경량화', 'json', 'css', 'js'],
  },
  {
    id: 'encoder',
    name: '인코딩 / JWT 디코더',
    shortDesc: 'Base64, URL, HTML, Unicode, Hex, Binary 변환 & JWT 토큰 해석',
    category: 'developer',
    icon: 'ArrowLeftRight',
    keywords: ['인코딩', '디코딩', 'base64', 'url', 'jwt', 'unicode', 'hex'],
  },
  {
    id: 'uuid-gen',
    name: 'UUID / ID 생성기',
    shortDesc: 'UUID v4, 시간순 UUID v7, ULID, NanoID 대량 생성',
    category: 'developer',
    icon: 'KeyRound',
    keywords: ['uuid', 'ulid', 'nanoid', 'guid', 'id'],
  },
  {
    id: 'key-code',
    name: '키보드 이벤트 검사',
    shortDesc: '실시간 키 입력의 key, code, keyCode, 조합키 상태 시각화',
    category: 'developer',
    icon: 'Keyboard',
    keywords: ['키보드', 'keycode', 'event', '단축키', 'keyboard'],
  },
  {
    id: 'html-viewer',
    name: 'HTML 소스 & 미리보기',
    shortDesc: '원격 URL의 HTML 소스·메타/OG 태그 조회 및 실시간 HTML 미리보기',
    category: 'developer',
    icon: 'FileCode',
    keywords: ['html', '소스보기', 'og', '미리보기', 'preview'],
    badge: 'network',
  },
  {
    id: 'crypto-tool',
    name: '암호화 & 보안 도구',
    shortDesc: 'AES-256 암복호화, SHA/MD5/HMAC 해시, 안전한 비밀번호 생성기',
    category: 'developer',
    icon: 'ShieldCheck',
    keywords: ['암호화', 'aes', 'sha256', 'hmac', '비밀번호', 'crypt'],
  },

  // 웹 / 피드 (1종)
  {
    id: 'rss-reader',
    name: 'RSS / 웹 게시글 뷰어',
    shortDesc: 'CORS 없이 RSS/Atom 피드 구독·영속 저장 및 깔끔한 리더 뷰',
    category: 'feed',
    icon: 'Rss',
    keywords: ['rss', 'atom', '피드', '뉴스', 'scrapper', '구독'],
    badge: 'network',
  },
];

export function getToolById(id: string): ToolMeta | undefined {
  return TOOLS.find((t) => t.id === id);
}
