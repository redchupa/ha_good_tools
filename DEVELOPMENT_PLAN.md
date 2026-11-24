# HA Good Tools — 개발 계획서 (Development Plan)

> **목표**: [wepplication/tools](https://github.com/wepplication/tools) (2021-06-17 개발 중단)의 32종 온라인 도구를 2026년 최신 웹 트렌드(React 19, TypeScript, Tailwind CSS v4, 다크모드, 반응형 UI, Web Crypto/Modern APIs, 로컬 프라이버시, CORS 우회 백엔드 프록시)로 전면 업그레이드하여 **Home Assistant App (Add-on, Ingress 지원)**으로 제공한다.

## 1. 아키텍처 개요

### 1.1 저장소 구조 (HA Add-on Repository)
```text
ha_good_tools/
├── repository.yaml              # HA Add-on 저장소 메타데이터
├── DEVELOPMENT_PLAN.md          # 마스터 개발 계획서 (본 문서)
├── PROGRESS.md                  # 실시간 진행 현황 & 모델 인수인계 문서
├── README.md                    # 사용자용 설치·기능 안내서
├── .gitignore
└── good_tools/                  # HA App (Add-on) 본체
    ├── config.yaml              # HA App 설정 (Ingress, 아키텍처, 옵션)
    ├── build.yaml               # 멀티아키텍처 베이스 이미지 (amd64, aarch64, armv7)
    ├── Dockerfile               # 멀티스테이지 빌드 (Frontend build -> Runtime)
    ├── run.sh                   # HA bashio 엔트리포인트
    ├── icon.png / logo.png      # HA App 아이콘 및 로고
    ├── DOCS.md                  # HA App 문서 탭
    ├── CHANGELOG.md             # 변경 이력
    ├── server/                  # Node.js + Express 백엔드 (정적 서빙 + 프록시 API + 영속 저장)
    │   ├── index.mjs            # 서버 엔트리포인트
    │   ├── routes/api.mjs       # /api/unshorten, /api/ipinfo, /api/fetch-html, /api/rss, /api/feeds
    │   ├── utils/ssrf.mjs       # SSRF 방어 (사설 IP·루프백 차단)
    │   └── tests/               # Node 내장 test runner 기반 백엔드 단위 테스트
    └── web/                     # React + Vite + TypeScript + Tailwind CSS v4 SPA
        ├── index.html
        ├── vite.config.ts       # base: './' (HA Ingress 상대경로 필수)
        ├── src/
        │   ├── App.tsx          # HashRouter 기반 라우팅
        │   ├── data/tools.ts    # 32종 도구 레지스트리 및 메타데이터
        │   ├── components/      # 공통 레이아웃, 사이드바, 검색, 테마, 복사 버튼 등
        │   ├── tools/           # 32종 도구 개별 구현체
        │   └── utils/           # 한영타, SMI/SRT, EML, 체크섬 등 순수 로직 + 단위 테스트
        └── package.json
```

### 1.2 Home Assistant Ingress 호환성 핵심 규칙
1. **상대 경로 에셋**: Vite `base: './'` 설정으로 `/api/hassio_ingress/<token>/` 하위에서 정상 로드.
2. **HashRouter 사용**: SPA 경로를 `#/tool/<id>` 형태로 유지하여 Ingress 리버스 프록시 및 새로고침 시 404 방지.
3. **상대 경로 API 호출**: 모든 백엔드 호출은 `./api/...`로 호출 (절대 경로 `/api/...` 금지).
4. **보안**: 백엔드 프록시 엔드포인트(`/api/unshorten`, `/api/fetch-html`, `/api/rss`)는 반드시 SSRF 방어(사설 IP 대역, localhost, 메타데이터 IP 차단, 타임아웃·응답 크기 제한) 적용.
5. **영속 데이터**: HA `/data` 볼륨(로컬 개발 시 `./.local_data`)에 사용자 RSS 피드 목록 등 저장.

## 2. 32종 도구 이식 및 최신화 매트릭스

### A. 일반 도구 (19종)
| # | 원본 ID | 도구명 | 구현 방식 | 2026 최신화 포인트 |
|---|---|---|---|---|
| 1 | `charMap` | 특수문자표 | Client | 카테고리 필터, 키워드 검색, 이모지·기호·한글 자모, 원클릭 복사 & 최근 사용 기록 |
| 2 | `asciiArtGen` | 아스키아트생성 | Client | 텍스트 FIGlet 스타일 배너 + 이미지→ASCII 아트 변환 (해상도·문자셋 조절) |
| 3 | `aniGifGen` | GIF생성기 | Client (`gifenc`) | 다중 이미지 드래그&드롭, 순서 변경, 프레임 딜레이(ms), 크기 조절, 즉시 미리보기·다운로드 |
| 4 | `barcodeGen` | 바코드/QR 생성기 | Client (`jsbarcode`, `qrcode`) | 1D 바코드(CODE128/EAN13/CODE39/UPC 등) + QR코드(텍스트/URL/Wi-Fi) SVG·PNG 다운로드 |
| 5 | `webEditor` | 웹 에디터 | Client | Markdown + HTML 실시간 분할 미리보기, 서식 툴바, 로컬 자동저장, MD/HTML 내보내기 |
| 6 | `smi2Srt` | 자막 변환기 | Client | SMI ↔ SRT ↔ VTT 상호 변환, EUC-KR/UTF-8 자동 감지, 시간 싱크 조절(±ms), 다운로드 |
| 7 | `charCounter` | 글자수 세기 | Client | 공백 포함/제외, 단어, 문장, 줄 수, UTF-8/EUC-KR 바이트, 예상 읽기 시간, 빈도 분석 |
| 8 | `eng2Kor` | 한영타 변환기 | Client | 두벌식 영타→한글 & 한글→영타 양방향 실시간 변환, 원클릭 복사 |
| 9 | `magicEyeGen` | 매직아이 생성기 | Client (Canvas) | 텍스트/기본 3D 도형/깊이맵 이미지 기반 오토스테레오그램 생성, 패턴·깊이 커스터마이즈 |
| 10 | `tts` | 문자 음성 변환 (TTS) | Client (Web Speech) | 브라우저 음성 선택(한국어/영어 등), 속도·피치·볼륨 조절, 재생/일시정지/중지 |
| 11 | `emlViewer` | EML 뷰어 | Client (`postal-mime`) | `.eml` 드래그&드롭, 헤더(보낸이/받는이/제목/날짜), 샌드박스 HTML/텍스트 본문, 첨부파일 다운로드 |
| 12 | `longUrl` | 원주소 변환기 | Backend (`/api/unshorten`) | 단축 URL 리다이렉트 체인 전체 추적, 상태코드 표시, SSRF 방어 |
| 13 | `ipconfig` | IP / 네트워크 조회 | Backend (`/api/ipinfo`, `/api/dns`) | 공인 IP·위치·ISP 조회 + DNS 레코드(A/AAAA/MX/TXT/CNAME) 조회 + CIDR 서브넷 계산기 |
| 14 | `lottoNumGen` | 로또 번호 생성기 | Client | 1~10게임 동시 생성, 고정수/제외수 설정, 색상 공 UI, 홀짝·합계 통계, 이력 저장 |
| 15 | `flashlight` | 화면 손전등 | Client (WakeLock) | 전체화면 조명, 색상 프리셋(백색/따뜻한색/적색/커스텀), 밝기, SOS/스트로브 모드, 화면 꺼짐 방지 |
| 16 | `postcode` | 우편번호 조회 | Client (Daum Postcode) | 다음(카카오) 우편번호 임베드 검색(팝업 없이 Ingress 내 동작), 도로명/지번/영문주소 복사 |
| 17 | `barcodeScanner` | 바코드/QR 스캐너 | Client (`html5-qrcode`) | 이미지 파일 업로드/붙여넣기 스캔(HTTP에서도 동작) + 실시간 카메라 스캔(HTTPS/localhost) |
| 18 | `fileChecksum` | 파일 체크섬 조회 | Client (`crypto-js` + WebCrypto) | 파일 드래그&드롭 및 텍스트 해시(MD5, SHA-1, SHA-256, SHA-512, CRC32) + 기대값 일치 비교 |
| 19 | `stt` | 음성 문자 변환 (STT) | Client (Web Speech) | 실시간 음성 인식(한국어/영어/일본어), 연속 인식, 복사/다운로드 (HTTP 환경 시 HTTPS 안내) |

### B. 개발자 도구 (12종)
| # | 원본 ID | 도구명 | 구현 방식 | 2026 최신화 포인트 |
|---|---|---|---|---|
| 20 | `htmlCodes` | HTML 코드표 | Client | 검색 가능한 HTML 엔티티 표 + 실시간 HTML Escape/Unescape 변환기 |
| 21 | `asciiCodes` | 아스키 코드표 | Client | 0~127 전체 표(DEC/HEX/OCT/BIN/설명), 카테고리 필터 + 문자열↔ASCII 변환기 |
| 22 | `colorPicker` | 색상표 & 팔레트 | Client | HEX/RGB/HSL/CMYK 상호 변환, WCAG 명암비 검사기, Tailwind 팔레트, 그라데이션 생성 |
| 23 | `img2Url` | 이미지 ↔ Data URL | Client | 이미지→Base64 Data URL(리사이즈/품질 압축 지원, HTML/CSS 스니펫) + Data URL→이미지 복원 |
| 24 | `compareDoc` | 코드/문서 비교 | Client (`diff`) | Side-by-Side / Unified Diff, 공백·대소문자 무시, 추가/삭제 라인 수 통계 |
| 25 | `beautifyCode` | 코드 정렬 (Beautify) | Client (`js-beautify`, `sql-formatter`, `js-yaml`) | JSON, HTML, CSS, JavaScript, SQL, XML, YAML 자동 정렬 & 들여쓰기 설정 |
| 26 | `minifyCode` | 코드 압축 (Minify) | Client | JSON, HTML, CSS, JavaScript, SQL, XML 경량 압축 + 원본 대비 절감률(%) 표시 |
| 27 | `encoder` | 인코딩 / 디코딩 | Client | Base64(UTF-8), URL, HTML Entity, Unicode(`\uXXXX`), Hex, Binary + **JWT 디코더** |
| 28 | `uuidGen` | UUID / ID 생성기 | Client | UUID v4, UUID v7(시간순 정렬), ULID, NanoID, 대량 생성(최대 100개), 대소문자/하이픈 옵션 |
| 29 | `keyCode` | 키보드 이벤트 검사 | Client | 실시간 키캡 시각화, `key`, `code`, `keyCode`, `location`, 조합키 상태, 최근 이벤트 로그 |
| 30 | `htmlViewer` | HTML 소스 & 미리보기 | Backend (`/api/fetch-html`) + Client | 원격 URL 소스 가져오기(메타/OG 태그 추출) + 실시간 HTML/CSS/JS 샌드박스 미리보기 |
| 31 | `crypt` | 암호화 & 보안 도구 | Client (`crypto-js` + WebCrypto) | AES-256-GCM/CBC 암복호화, SHA/MD5/HMAC 해시, 안전한 비밀번호 생성기 |

### C. 웹/피드 도구 (1종)
| # | 원본 ID | 도구명 | 구현 방식 | 2026 최신화 포인트 |
|---|---|---|---|---|
| 32 | `scrapper` | RSS / 웹 게시글 뷰어 | Backend (`/api/rss`, `/api/feeds`) | CORS 없이 RSS/Atom 피드 파싱, 피드 즐겨찾기 영속 저장(`/data/feeds.json`), 깔끔한 리더 뷰 |

## 3. 단계별 개발 일정 (Phases)
- **Phase 1**: 저장소 초기화, GitHub 원격 연동, `DEVELOPMENT_PLAN.md` & `PROGRESS.md` 생성
- **Phase 2**: HA App 메타파일(`repository.yaml`, `config.yaml`, `build.yaml`, `Dockerfile`, `run.sh`, 아이콘) 및 Node.js 백엔드 API + SSRF 방어 + 백엔드 단위 테스트 구축
- **Phase 3**: React + Vite + TypeScript + Tailwind CSS v4 프론트엔드 셸 구축 (대시보드 홈, 사이드바, 커맨드 검색 `Ctrl+K`, 즐겨찾기, 다크/라이트 테마)
- **Phase 4**: 일반 도구 19종 구현 및 유틸리티 단위 테스트
- **Phase 5**: 개발자 도구 12종 + RSS/웹 게시글 뷰어 1종 구현
- **Phase 6**: 전체 빌드·타입체크·단위테스트 실행, `README.md` / `DOCS.md` / `CHANGELOG.md` 작성 및 마크다운 검증
- **Phase 7**: Git 커밋·푸시, `v1.0.0` 태그 & GitHub Release 생성, **서브 HA(`http://192.168.1.129`)** 설치·실행·동작 검증

## 4. 테스트 환경 규칙
- **절대 메인 HA(`http://192.168.1.118:8123` / `home-assistant` MCP)나 `nrgnc-ha` MCP를 건드리지 않는다.**
- 테스트는 반드시 **서브 HA(`http://192.168.1.129`)**에서만 수행한다.
