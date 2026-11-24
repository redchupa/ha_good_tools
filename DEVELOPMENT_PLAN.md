# HA Good Tools — 개발 계획서 (Development Plan)

> **목표**: Home Assistant 사이드바(Ingress)에서 광고·추적 없이 안전하고 빠르게 동작하는 **올인원 유틸리티 · 개발자 · Home Assistant 특화 도구 모음**을 제공한다.

## 1. 아키텍처 개요
- **컨테이너**: Alpine 3.23 기반 멀티아키텍처(`amd64`, `aarch64`, `armv7`) HA App (Ingress 포트 `8099`)
- **백엔드 (`good_tools/server/`)**: Node.js + Express (`index.mjs`, `routes/api.mjs`, `utils/ssrf.mjs`, `utils/lan.mjs`)
  - 영속 데이터(`/data/`): `feeds.json`, `clipboard.json`, `prefs.json`
  - 네트워크 프록시(SSRF 방어): `/api/unshorten`, `/api/ipinfo`, `/api/dns`, `/api/fetch-html`, `/api/rss`, `/api/ssl-check`
  - LAN 유틸리티(`allow_lan_tools` 옵션): `/api/wol`, `/api/port-check`
- **프론트엔드 (`good_tools/web/`)**: React 19 + Vite 6 + TypeScript + Tailwind CSS v4 (`base: './'`, `HashRouter`, 코드 스플리팅)

## 2. v1.1.0 확장 개발 계획 (신규 도구 14종 + 플랫폼 UX 3종)

### A. Home Assistant 전용 도구 (`ha` 카테고리, 5종)
1. `ha-yaml-json`: **HA YAML ↔ JSON 변환 & 검사기** — `js-yaml` 기반 실시간 구문 검사, 양방향 변환, HA 자동화/센서 스니펫
2. `ha-cron`: **Cron 표현식 & 스케줄 시뮬레이터** — 5필드 크론 한국어 해석, 다음 5회 실행 시각 계산, HA `time_pattern` 프리셋
3. `ha-jinja`: **HA Jinja2 템플릿 스니펫 모음** — 상태·속성·날짜·영역·반복문 등 실전 HA 템플릿 검색 & 원클릭 복사
4. `lan-wol`: **LAN 포트 점검 & Wake-on-LAN (WoL)** — 백엔드 UDP 매직패킷 전송(`/api/wol`) & TCP 포트 연결 점검(`/api/port-check`)
5. `shared-clipboard`: **가족 공유 클립보드 / 임시 메모장** — `/data/clipboard.json` 영속 저장으로 PC·모바일 HA 앱 간 링크/텍스트 즉시 공유

### B. 일상·파일·이미지 도구 (`general` 확장, 5종)
6. `pdf-tools`: **PDF 병합 / 분할 / 이미지→PDF** — `pdf-lib` 기반 100% 브라우저 로컬 처리
7. `image-studio`: **이미지 리사이즈 · 포맷 변환 · 압축 & EXIF 제거** — Canvas 기반 PNG/JPG/WebP 변환, 용량 절감, 위치정보(EXIF) 제거
8. `unit-date-calc`: **단위 · 평수 · 날짜(D-Day/만나이) 계산기** — 평↔㎡, 길이/무게/온도/데이터 단위 변환 + D-Day·만나이·날짜 차이
9. `regex-tester`: **정규표현식(Regex) 테스터 & 치환기** — 실시간 매칭 하이라이트, 캡처 그룹, 한국어 프리셋(전화번호·이메일·마스킹 등)
10. `csv-json`: **CSV / TSV ↔ JSON 변환 & 테이블 뷰어** — CSV/JSON 상호 변환 및 검색·정렬 가능한 표 미리보기

### C. 개발자·보안 도구 (`developer` 확장, 4종)
11. `timestamp-conv`: **Unix Timestamp ↔ KST/ISO 변환기** — 실시간 시계, 초/밀리초 자동 감지, 상대 시간, 날짜→타임스탬프 변환
12. `json-explorer`: **JSON 트리 탐색기 & 경로 추출기** — 접기/펼치기 트리 UI, 키/값 검색, 클릭 시 JSONPath(`$.a.b[0]`) 복사
13. `ssl-checker`: **SSL 인증서 & HTTP 보안 헤더 진단기** — 백엔드 TLS 핸드셰이크(`/api/ssl-check`)로 인증서 만료 D-Day, 발급자, HSTS/CSP 헤더 진단
14. `favicon-gen`: **SVG 미리보기 & 아이콘/Favicon 생성기** — 이미지/SVG 업로드로 `favicon-32`, `apple-touch-icon-180`, HA `icon.png(256)`/`logo.png(512x256)` 생성

### D. 플랫폼 & UX 업그레이드 (3종)
15. **HA `/data/prefs.json` 기반 즐겨찾기·숨김 설정 서버 동기화**: PC·모바일 HA 앱 간 즐겨찾기 및 숨긴 도구 자동 동기화
16. **홈 화면 도구 표시/숨기기 관리**: 자주 쓰는 도구만 표시하고 불필요한 도구는 숨김 처리
17. **한국어 / English (i18n) UI 전환**: 상단 바에서 원클릭 언어 전환
