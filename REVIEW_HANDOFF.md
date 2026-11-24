# HA Good Tools — 교차 리뷰 및 업그레이드 검토 문서 (`REVIEW_HANDOFF.md`)

> **용도**: 본 문서는 3,000명 이상이 사용하는 Home Assistant 앱(Add-on) 수준의 품질을 확보하기 위해, 다른 AI 모델(Claude, GPT 등)이나 리뷰어가 코드베이스 전체를 빠르게 파악하고 **① 잠재 버그·보안·성능 결함 진단**과 **② 한 단계 더 업그레이드할 수 있는 개선 아이디어 제안**을 수행할 수 있도록 작성되었습니다.

---

## 1. 프로젝트 개요
- **저장소**: `https://github.com/redchupa/ha_good_tools`
- **현재 버전**: `v1.3.2`
- **목적**: Home Assistant 사이드바(Ingress)에서 광고·추적 없이 바로 사용할 수 있는 올인원 일상·스마트홈·개발자·미니게임 웹 앱
- **테스트 환경 규칙**: 테스트는 반드시 **서브 HA(`http://192.168.1.129`)**에서만 수행 (메인 HA 절대 건드리지 않음)

---

## 2. 기술 스택 & 아키텍처

```text
ha_good_tools/
├── repository.yaml              # HA Add-on 저장소 정의
├── README.md                    # 일반 사용자용 소개·설치·후원 안내
├── DEVELOPMENT_PLAN.md          # 개발 계획서
├── PROGRESS.md                  # 작업 이력 및 진행 현황
├── REVIEW_HANDOFF.md            # 본 문서 (교차 리뷰·업그레이드 검토용)
└── good_tools/
    ├── config.yaml              # HA App 설정 (amd64/aarch64/armv7, ingress: true, port: 8099)
    ├── build.yaml               # ghcr.io/home-assistant/{arch}-base:3.23
    ├── Dockerfile               # Alpine 3.23 + Node.js/npm 빌드 및 런타임
    ├── .dockerignore            # node_modules, dist, Windows package-lock.json 제외
    ├── run.sh                   # bashio 엔트리포인트 (LF 줄바꿈)
    ├── DOCS.md / CHANGELOG.md
    ├── server/                  # Node.js + Express 4 백엔드
    │   ├── index.mjs            # 정적 서빙(index.html no-cache, assets immutable) + 전역 에러 핸들러
    │   ├── routes/api.mjs       # REST API + safeFetchPublic + 원자적 직렬 JSON 저장
    │   ├── utils/ssrf.mjs       # IPv4/IPv6 사설·루프백·CGNAT·링크로컬·.local 차단
    │   ├── utils/lan.mjs        # UDP Wake-on-LAN, TCP 포트 점검, TLS 인증서/보안헤더 진단
    │   └── tests/server.test.mjs# node:test 단위 테스트 (8/8 통과)
    └── web/                     # React 19 + Vite 6 + TypeScript(strict) + Tailwind CSS v4
        ├── vite.config.ts       # base: './' (HA Ingress 상대경로 필수)
        ├── src/
        │   ├── App.tsx          # HashRouter + React.lazy 코드 스플리팅 + ErrorBoundary
        │   ├── index.css        # 15종 테마 CSS 변수 스키닝 및 커스텀 배너 스타일
        │   ├── data/tools.ts    # 전체 50개 도구 메타데이터 (5개 카테고리)
        │   ├── hooks/usePreferences.ts # 테마/즐겨찾기/숨김/언어 (/api/prefs 서버 동기화)
        │   ├── components/      # Layout(사이드바·Ctrl+K·도구관리·테마팝오버·KO/EN), ToolShell, CopyButton, ErrorBoundary
        │   ├── pages/HomePage.tsx
        │   ├── tools/           # 50개 도구 개별 컴포넌트
        │   └── utils/           # 한영타, 자막, CRC32, CIDR, UUID/ULID/NanoID + Vitest (7/7 통과)
        └── package.json
```

---

## 3. 구현된 기능 현황 (총 50개 도구 + 플랫폼 UX)

1. **Home Assistant 전용 (5개)**: 가족 공유 클립보드(`/api/clipboard`), HA YAML↔JSON 검사기, Cron & 스케줄 시뮬레이터, HA Jinja2 템플릿 모음, LAN 포트 점검 & Wake-on-LAN(`/api/port-check`, `/api/wol`)
2. **일반 도구 (24개)**: 나라별 환율 계산기(2026년 연평균 기본값 15개국 + 사용자 수정), PDF 병합/분할/이미지→PDF(`pdf-lib`), 이미지 리사이즈/포맷 변환/압축 & EXIF 제거, 단위·평수·날짜(D-Day/만나이) 계산기, 정규표현식 테스터, CSV↔JSON 테이블 뷰어, 특수문자표, 아스키아트 생성, GIF 생성기(`gifenc`), 바코드 & QR 생성기(Wi-Fi QR), Markdown 웹 에디터(샌드박스 iframe), 자막 변환기(SMI↔SRT↔VTT), 글자수 세기, 한영타 변환기, 매직아이 생성기, TTS, EML 뷰어(`postal-mime`), 원주소 변환기(`/api/unshorten`), IP/DNS/CIDR 조회(`/api/ipinfo`, `/api/dns`), 화면 손전등(SOS/WakeLock), 우편번호 조회(카카오 `t1.kakaocdn.net`), 바코드 & QR 스캐너(`html5-qrcode`), 파일 체크섬 조회(MD5/SHA/CRC32), STT
3. **개발자 도구 (16개)**: Unix Timestamp 변환기, JSON 트리 & JSONPath 탐색기, SSL 인증서 & HTTP 보안 헤더 진단(`/api/ssl-check`), SVG & Favicon/아이콘 생성기, HTML 코드표, 아스키 코드표, 색상표 & WCAG 명암비 검사, 이미지↔Data URL, 코드/문서 Diff, 코드 정렬, 코드 압축, 인코딩/JWT 디코더, UUID v4/v7·ULID·NanoID 생성기, 키보드 이벤트 검사, HTML 소스 & 미리보기(`/api/fetch-html`), 암호화 & 보안 비밀번호 생성기
4. **웹 / 피드 (1개)**: RSS / Atom 피드 리더(`/api/rss`, `/api/feeds`)
5. **미니게임 전용 탭 (4개)**: 사다리타기(2~8명, 커스텀 이름/당첨), 점심 메뉴 룰렛(커스텀 항목·프리셋), 반응속도 테스트(ms·오늘 최고 기록), 로또 번호 생성기
6. **플랫폼 UX**: 15종 테마(기본 4 · 귀엽고 예쁜 5 · 미래/로봇/감성 다크 6), `/data/prefs.json` 기반 PC↔모바일 자동 동기화, 도구 표시/숨기기 관리, `Ctrl+K` 빠른 검색, KO/EN 언어 전환

---

## 4. 이미 완료된 자체 보안·품질 검증 (`v1.3.2`)

- **SSRF 방어**: `/api/unshorten`, `/api/fetch-html`, `/api/rss`, `/api/ssl-check` 모두 `assertSafePublicUrl()` 적용 + 3xx 리다이렉트 전 단계(`safeFetchPublic`) 재검증 + 응답 크기 2MB / 타임아웃 10초 제한
- **XSS 차단**: 전체 프론트엔드 `dangerouslySetInnerHTML` / `eval()` / 절대경로 `fetch('/api')` **0건** (Markdown·EML·HTML 미리보기 모두 `<iframe sandbox="" srcDoc=... />` 격리)
- **데이터 무결성**: `/data/prefs.json`, `/data/clipboard.json`, `/data/feeds.json` 모두 파일별 직렬 큐 + 임시파일 후 `fs.rename` 원자적 저장
- **크래시 격리**: React `ErrorBoundary`로 개별 도구 예외 격리, Express 전역 에러 핸들러 적용
- **캐시 제어**: `index.html`에 `no-cache, no-store, must-revalidate` 적용해 HA 앱 업데이트 시 즉시 새 UI 반영
- **의존성 & 테스트**: 백엔드 `npm audit --omit=dev` 취약점 0건, 백엔드 `node:test` 8/8 통과, 프론트엔드 `tsc -b && vite build` 0 에러, Vitest 7/7 통과, 서브 HA(`http://192.168.1.129`) 실동작 Ingress 검증 완료

---

## 5. 리뷰어(Claude / GPT)에게 요청할 검토 항목

아래 두 가지 관점에서 코드를 면밀히 검토하고 구체적인 수정 코드와 우선순위를 제안해 주세요.

### 관점 A: 3,000명 사용 환경 기준 잠재 버그 · 보안 · 성능 감사
1. **SSRF / DNS Rebinding & 네트워크 보안**:
   - `good_tools/server/utils/ssrf.mjs` 및 `routes/api.mjs`에서 DNS Rebinding(검사 시점과 실제 `fetch()` 연결 시점 사이 IP 변경), IPv6 특수 주소, `inspectSsl()`의 TLS/HEAD 리다이렉트 처리 등에 빈틈이 없는지 점검
   - `allow_lan_tools` (`/api/wol`, `/api/port-check`)의 입력 검증, 타임아웃, 동시 요청 남용(DoS) 방지 필요 여부
2. **백엔드 안정성 & 동시성**:
   - `routes/api.mjs`의 모든 async 라우트에 누락된 `asyncRoute` 래핑이 있는지 확인 (특히 `/api/feeds`, `/api/prefs`, `/api/clipboard`, `/api/unshorten`, `/api/ipinfo`, `/api/dns`, `/api/wol`, `/api/port-check`, `/api/ssl-check`)
   - `PUT /api/prefs` 동시 호출 시 Read-Modify-Write 경쟁 조건(race condition) 여부
   - Windows/Linux 환경별 `fs.rename` 및 대용량 요청 처리 안전성
3. **프론트엔드 메모리 누수 · 엣지케이스 · 모바일 UX**:
   - `URL.createObjectURL` 호출 후 `revokeObjectURL` 누락 여부 (`GifGenTool`, `ImageStudioTool`, `BarcodeGenTool`, `WebEditorTool`, `SubtitleConvTool`, `EmlViewerTool`, `PdfTools`, `FaviconGenTool`)
   - 대용량 파일(50MB+ PDF/이미지/체크섬) 업로드 시 브라우저 메모리/UI 프리징 방지 여부
   - `RegexTesterTool`의 ReDoS(악성 정규표현식 무한 루프) 또는 zero-length 매치 처리
   - `CsvJsonTool`의 따옴표 내 쉼표(`"a,b"`) 파싱 정확도
   - `HaCronTool`의 잘못된 크론식 입력 시 무한 루프/성능 저하 여부
   - `PostcodeTool` 언마운트 시 비동기 스크립트 콜백 안전성 및 다크 테마 가독성
   - Home Assistant 모바일 Companion App(iOS/Android WebView)에서의 파일 다운로드, 클립보드 복사, 터치 조작 호환성
4. **Dockerfile & 멀티아키텍처(`armv7` 포함) 빌드 안정성**:
   - Raspberry Pi (`armv7` / `aarch64`)에서 `npm install` + `vite build` 시 메모리(OOM) 또는 빌드 시간 이슈가 없는지, 그리고 **사전 빌드된 Docker 이미지(GHCR)** 배포 전환 필요성 검토

### 관점 B: 제품 완성도를 한 단계 더 끌어올릴 업그레이드 제안
1. **Home Assistant 연동 심화**: HA Supervisor API / WebSocket을 연동해 실제 내 HA 엔티티를 바로 불러오는 기능(예: HA Jinja2 실시간 평가 테스트, 실제 HA YAML/엔티티 검색, 공유 클립보드 HA 알림 전송 등)
2. **성능 & 번들 최적화**: `index` 메인 번들(현재 약 1MB / gzip 236KB) 축소 방안, `crypto-js`(deprecated) → Web Crypto API + 경량 MD5 교체 검토, 프론트엔드 취약 의존성(`diff`, `js-beautify`의 `glob/minimatch`) 정리 방안
3. **3,000명 사용자를 만족시킬 킬러 UX/기능**:
   - 최근 사용한 도구 기록, 도구별 단축키/공유 링크, 다국어(EN) 도구 내부 번역 완성도 향상
   - 미니게임·환율 계산기·PDF/이미지 도구에서 사용자 만족도를 크게 높일 디테일 개선점
   - 자동화 테스트(Playwright E2E, GitHub Actions CI + 멀티아키텍처 GHCR 자동 빌드) 도입 전략
