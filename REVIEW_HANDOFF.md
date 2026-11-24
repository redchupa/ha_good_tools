# HA Good Tools — 교차 리뷰 및 업그레이드 검토 문서 (`REVIEW_HANDOFF.md`)

> **2026-11-24 감사 결과**는 아래 「v1.3.3 코드 감사」에 기록했습니다. 1~5절은 v1.3.2 검토 당시의 인수인계 자료입니다.

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

## 6. v1.3.3 코드 감사

3,000명은 여러 HA 설치의 전체 사용자 규모로 보았습니다. 공유 메모·피드·설정은 설치 단위로 공유합니다. 따라서 동시성 검증은 같은 설치에서 여러 기기가 요청하는 상황을 다뤘습니다.

| 심각도 | 코드에서 확인한 문제 | 조치 또는 남은 범위 |
|---|---|---|
| Critical | 배포된 런타임에서 이 등급으로 판정한 결함은 없었습니다. 기존 웹 의존성 전체 감사에서는 Vitest와 Tinypool에 Critical 2건이 표시됐습니다. | Vite 8·Vitest 5로 갱신하고 개발 도구를 최종 이미지에서 분리했습니다. |
| High | `ssrf.mjs`, `api.mjs`, `lan.mjs`가 DNS 검사 뒤 호스트명을 다시 연결했고 TLS 진단의 HEAD가 다음 주소를 자동 추적했습니다. | HTTP·HTTPS 소켓은 검증한 주소로 연결하고 원래 Host 및 TLS 이름을 유지합니다. URL 추적은 각 단계에서 다시 검증하고 TLS 진단은 최초 응답의 헤더만 보고합니다. 특수 IPv6·IPv4 대역 검사를 보강했습니다. |
| High | 선택형 8099 포트에 연결하면 HA 사용자 인증 없이 공유 데이터와 네트워크 기능에 접근할 수 있었습니다. LAN 진단에 대상·빈도 제한이 부족했습니다. | 직접 포트 매핑 제거, 컨테이너에서 Ingress 프록시의 소켓 주소 검사, 신규 설치 LAN 기본 꺼짐. 네트워크 작업은 인스턴스별 동시 실행·분당 횟수 제한을 적용합니다. 기존 설치의 명시적 옵션은 유지됩니다. |
| High | 원자적 rename 앞에서 읽은 낡은 배열을 덮어쓰므로 동시 메모·피드·설정 변경이 유실됐습니다. Express 4는 일부 비동기 파일 예외를 오류 처리기로 전달하지 않았습니다. | 파일별 읽기·변경·쓰기를 한 큐에서 실행합니다. 임시 파일은 같은 디렉터리에 두고 정리합니다. 누락 파일만 기본값을 사용합니다. 손상 파일 보존과 실패 뒤 다음 요청을 회귀 테스트했습니다. Windows 파일 잠금 동작은 실측하지 않았습니다. 배포 환경은 Linux입니다. |
| High | `CryptoTool`이 모든 설치에서 동일한 암호 문구를 미리 입력했습니다. | 사용자 입력을 요구합니다. 기존 CryptoJS 암호문 호환은 유지합니다. |
| High | `RegexTesterTool`이 사용자 패턴의 검색·치환을 React 렌더에서 동기 실행했습니다. | Worker를 교체·종료하며 1.2초 제한을 적용합니다. matchAll 반복으로 빈 매치도 진행하며 화면에는 200개까지 표시합니다. 입력·치환 팽창량을 제한합니다. |
| High | `build.yaml`의 armv7 Alpine 3.23 베이스는 GHCR manifest 조회에서 404였습니다. 프론트 빌드는 musl용 네이티브 바이너리에 의존했습니다. | 게시된 armv7 3.22 베이스와 Debian 빌더를 선택하고 잠금 파일로 npm ci를 실행합니다. aarch64·amd64 3.23 manifest는 200이었습니다. ARM 장치에서의 설치 성공과 최대 RSS는 미검증입니다. |
| Medium | sandbox가 있는 메일·HTML·Markdown에서도 외부 이미지를 요청할 수 있었습니다. RSS 항목의 링크 프로토콜 제한도 없었습니다. | 미리보기에 CSP 적용, 피드 항목은 HTTP(S)만 연결합니다. 카카오 우편번호 CDN 스크립트는 여전히 앱 문서 권한으로 실행됩니다. 공급망 위험을 줄이려면 별도 origin 위젯으로 격리하고 주소 선택만 전달해야 합니다. |
| Medium | CSV를 행·쉼표로 잘라 인용된 쉼표·줄바꿈·이스케이프 따옴표에서 데이터가 바뀌었습니다. 크론은 잘못된 필드도 최대 527,040분을 탐색하고 요일 제약을 뺀 HA 예시를 제공했습니다. | CSV 레코드 파서와 오류 표시, 크론 범위·간격 선검증, 날짜 단위 탐색을 적용했습니다. 직접 표현 가능한 일정만 HA YAML을 제공합니다. 1년 범위의 로컬 시간 미리보기입니다. |
| Medium | PDF·EML·바코드·자막·에디터의 다운로드 URL과 이미지·GIF·파비콘 미리보기 URL이 남았습니다. 체크섬은 입력 전체를 여러 번 복제하고 GIF는 모든 프레임을 동시에 디코딩했습니다. | 다운로드 후 지연 해제, 교체·삭제·화면 종료 시 미리보기 정리, 파일 크기·출력 픽셀·프레임 수 제한, GIF 순차 로딩을 적용했습니다. 작은 압축 파일도 디코딩 결과가 클 수 있으며 체크섬·PDF 계산은 여전히 메인 스레드를 사용합니다. |
| Medium | 테마·즐겨찾기 초기 GET과 사용자 편집이 겹칠 수 있고 같은 필드를 두 기기에서 편집하면 마지막 쓰기가 이깁니다. | 이번 변경은 필드별 저장과 서버 측 트랜잭션까지 보장합니다. 다음 단계는 초기 응답 적용 시 편집 여부 검사 및 필드별 리비전입니다. |
| Medium | 코드 압축기의 정규식 기반 주석·공백 제거는 문자열과 구문 경계를 보장하지 않습니다. YAML→JSON, 코드 Diff, 일부 이미지 입력도 큰 자료에서 UI 비용이 큽니다. | 언어별 파서와 예제 기반 동등성 테스트, Worker·취소·시간/메모리 제한을 후속 범위로 둡니다. |
| Low | 우편번호 스크립트 콜백, TTS 이벤트, STT·카메라 시작 중 화면 종료, 손전등 Wake Lock 정리 경로가 부족했습니다. 반응 게임이 터치와 마우스 이벤트를 별도로 받았습니다. | 정리 경로, 포인터·키보드 입력을 보완했습니다. 주소 결과에는 다크 테마 스타일이 있으나 외부 위젯 내부 대비와 iOS/Android 파일 저장·복사·권한 UI는 실기기 확인이 필요합니다. |
| Low | 날짜 계산기는 UTC 날짜를 오늘로 사용했고 환율 예시에 출처 없는 연평균 표기가 있었습니다. | 사용자 로컬 달력 날짜로 계산하고 환율을 예시로 표시합니다. |

### 서브 HA 검증

- 192.168.1.129의 x86_64 환경에서 백엔드 node:test 11개와 프론트 Vitest 10개 통과. TypeScript 및 Vite 프로덕션 빌드 성공. 백엔드 production 및 프론트 전체 npm audit 모두 0건.
- 동일 서브 HA에서 아이콘 전체 동적 참조가 있던 중간 빌드와 최종 빌드의 index JS를 비교했습니다. 1,095.17 → 321.03 kB, gzip 236.89 → 102.26 kB. 공유 런타임·CSS·도구별 청크는 이 수치에서 제외됩니다.
- 종전 오류 등급은 코드 경로와 사용 조건에 따른 판정입니다. 3,000 동시 접속 부하, Raspberry Pi 실기기 메모리, iOS/Android Companion 동작은 별도 검증 항목입니다.

## 7. 우선순위별 제품 개선안

| 순위 | 작업 | 완료 기준 |
|---|---|---|
| P0 배포 | amd64·aarch64 런타임 이미지를 GHCR에 사전 게시합니다. 프론트는 빌더에서 한 번 컴파일하고 각 타깃에는 dist만 복사합니다. armv7은 레거시 대상으로 분리합니다. | 버전별 두 아키텍처 manifest 및 이전 버전 복구 확인 후 config.yaml의 image를 전환합니다. 실기기 검증 전 armv7 성공으로 표시하지 않습니다. |
| P0 검증 | PR에서 정적 검사와 의존성 검사, 서브 HA 전용 runner에서 테스트·이미지 설치·Ingress 점검을 분리합니다. 외부 PR 코드는 서브 HA 자격 증명이 있는 runner에 직접 보내지 않습니다. | 신뢰된 커밋만 승격하고 두 테스트 스위트, 설치, 버전 응답, 첫 화면·lazy route가 통과해야 태그를 게시합니다. Playwright로 느린 요청·키보드·터치 뷰포트·파일 업로드를 추가합니다. |
| P1 모바일 | 파일 처리에 취소 가능한 Worker·청크 해시·진행률을 적용하고 PDF 페이지 선택 미리보기와 이미지 예상 출력 크기를 표시합니다. | 예산을 정한 Android/iPhone에서 50 MiB 파일 처리 또는 명시적 거절, 화면 복귀·공유·다운로드·복사 확인. 각 도구의 실패 메시지에 복구 동작을 제공합니다. |
| P1 HA 연동 | 읽기 전용 엔티티 검색을 첫 기능으로 도입합니다. Jinja 평가·클립보드 알림은 별도 선택 기능으로 두고 승인한 서비스·대상만 호출합니다. | 서버에서만 HA 토큰을 사용하고 브라우저에 토큰·전체 상태 목록을 전달하지 않습니다. 비관리자 권한, 권한 철회, HA 연결 끊김을 검증합니다. |
| P1 의존성 | SHA/HMAC은 Web Crypto, 신규 암호문에는 버전이 붙은 AES-GCM 및 암호 문구 KDF를 도입하고 MD5는 파일 호환용 경량 구현으로 한정합니다. | 기존 암호문 복호화, HTTPS/HTTP Ingress 기능 감지, 표준 해시 벡터 테스트. 초기 JS gzip 예산은 현재 수치에 여유를 둔 120 kB로 추적합니다. |
| P2 발견·재사용 | 최근 도구를 기기별로 저장하고 현재 도구의 HA 이동 링크를 제공합니다. 언어 선택을 도구 내부 도움말·오류·접근성 이름까지 확장합니다. | Ingress 세션 토큰을 공유 링크에 포함하지 않고 모바일 재접속·언어 변경 후 같은 도구를 열 수 있어야 합니다. |
| P2 일상 도구 | 환율에 출처·기준일·사용자 수정 상태를 구분하고 마지막 성공 값을 캐시합니다. 게임에는 룰렛 목록 저장·모션 감소를 추가합니다. | 오프라인에서도 기준일을 확인할 수 있고 게임 결과를 애니메이션 없이 읽을 수 있어야 합니다. |

HA의 공식 32비트 지원은 2025.12에 종료됐습니다. 이미지 전환 시 Supervisor가 앱 버전과 일치하는 태그를 가져오는 동작도 함께 고려해야 합니다. [HA 아키텍처 지원 공지](https://www.home-assistant.io/blog/2025/05/22/deprecating-core-and-supervised-installation-methods-and-32-bit-systems/) · [앱 설정 레퍼런스](https://contributors.home-assistant.io/apps/reference/configuration/)
