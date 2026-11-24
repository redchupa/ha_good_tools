# Good Tools for Home Assistant

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fredchupa%2Fha_good_tools)

[wepplication/tools](https://github.com/wepplication/tools) (2021년 6월 이후 업데이트 중단)의 온라인 도구 32종을 **2026년 최신 웹 기술(React 19, TypeScript, Tailwind CSS v4, 다크모드, 로컬 프라이버시, CORS 우회 백엔드 프록시)**로 전면 재구축한 **Home Assistant 앱(Add-on)**입니다.

## 주요 특징

- **Home Assistant 사이드바(Ingress) 네이티브 통합**: 별도 포트 개방이나 로그인 없이 HA 사이드바에서 바로 사용합니다.
- **광고·추적 제로, 로컬 우선 처리**: 32종 중 28종은 외부 서버 전송 없이 브라우저 내에서 100% 로컬로 동작합니다.
- **안전한 서버 프록시**: 단축 URL 추적, IP/DNS 조회, 원격 HTML 소스 보기, RSS 피드 리더는 SSRF 방어(사설 IP 차단)가 적용된 내장 백엔드를 통해 CORS 제약 없이 동작합니다.
- **현대적인 UI/UX**: 다크/라이트/시스템 자동 테마, `Ctrl+K` 빠른 도구 검색, 즐겨찾기, 모바일 반응형 레이아웃을 지원합니다.

## 포함된 도구 (총 32종)

### 일반 도구 (19종)
1. **특수문자표** — 카테고리·유니코드 검색, 원클릭 복사, 최근 사용 기록
2. **아스키아트 생성** — 텍스트 배너 & 이미지→ASCII 아트 변환
3. **GIF 생성기** — 다중 이미지 순서 편집, 프레임 딜레이·크기 조절, 로컬 GIF 제작
4. **바코드 & QR 생성기** — CODE128/EAN13/UPC 바코드 및 URL/Wi-Fi QR코드 생성
5. **웹 에디터** — Markdown 실시간 분할 미리보기, 자동 저장, `.md`/`.html` 내보내기
6. **자막 변환기 (SMI↔SRT↔VTT)** — UTF-8/EUC-KR 자동 감지 및 시간 싱크 이동(ms)
7. **글자수 세기** — 공백 포함/제외, 단어, 줄, UTF-8/EUC-KR 바이트, 읽기 시간
8. **한영타 변환기** — 두벌식 영타↔한글 양방향 실시간 변환
9. **매직아이 생성기** — 텍스트 기반 오토스테레오그램 이미지 생성 및 저장
10. **문자 음성 변환 (TTS)** — 브라우저 음성 선택, 속도/음높이 조절
11. **EML 뷰어** — `.eml` 파일 헤더, 샌드박스 HTML/텍스트 본문, 첨부파일 다운로드
12. **원주소 변환기** — 단축 URL 리다이렉트 체인 추적 (서버 프록시)
13. **IP / 네트워크 조회** — 공인 IP·위치·ISP, DNS 레코드 조회, CIDR 서브넷 계산기
14. **로또 번호 생성기** — 고정수/제외수 설정, 다중 게임 추첨, 홀짝·합계 통계
15. **화면 손전등** — 전체화면 조명, 색상 프리셋, 점멸/SOS 모드, 화면 꺼짐 방지
16. **우편번호 조회** — 대한민국 도로명/지번/영문주소 및 5자리 우편번호 검색
17. **바코드 & QR 스캐너** — 이미지 파일 업로드 스캔(HTTP 지원) 및 실시간 카메라 스캔(HTTPS)
18. **파일 체크섬 조회** — MD5, SHA-1, SHA-256, SHA-512, CRC32 계산 및 기대값 일치 검증
19. **음성 문자 변환 (STT)** — 실시간 마이크 음성 받아쓰기 (HTTPS 환경 지원)

### 개발자 도구 (12종)
20. **HTML 코드표** — HTML 엔티티 검색 표 & 실시간 Escape
21. **아스키 코드표** — 0부터 127까지 전체 ASCII 표(DEC/HEX/OCT/BIN) & 문자열 변환
22. **색상표 & 팔레트** — HEX/RGB/HSL 변환, WCAG AA/AAA 명암비 검사, Tailwind 팔레트
23. **이미지 ↔ Data URL** — 이미지 Base64 변환, HTML/CSS 스니펫 복사, 역변환 미리보기
24. **코드 / 문서 비교** — 줄 단위 Diff 뷰어, 공백 무시 옵션, 추가/삭제 통계
25. **코드 정렬 (Beautify)** — JSON, JS, HTML, CSS, SQL, YAML 포맷터
26. **코드 압축 (Minify)** — JSON, HTML, CSS, JS, SQL 경량화 및 절감률 표시
27. **인코딩 / JWT 디코더** — Base64, URL, Unicode, Hex 변환 및 JWT 토큰 해석
28. **UUID / ID 생성기** — UUID v4, 시간순 UUID v7, ULID, NanoID 대량 생성
29. **키보드 이벤트 검사** — `key`, `code`, `keyCode`, 조합키 상태 실시간 확인
30. **HTML 소스 & 미리보기** — 원격 URL HTML·메타/OG 태그 조회 & 실시간 HTML 샌드박스 미리보기
31. **암호화 & 보안 도구** — AES-256 암복호화, HMAC/SHA/MD5 해시, 안전한 비밀번호 생성기

### 웹 / 피드 (1종)
32. **RSS / 웹 게시글 뷰어** — CORS 없는 RSS/Atom 피드 리더 & 피드 즐겨찾기 영속 저장(`/data/feeds.json`)

## 설치 방법

1. 위 **Add Repository** 배지를 클릭하거나, Home Assistant의 **설정 → 앱(애드온) → 앱 스토어 → 우측 상단 점 3개(⋮) → 저장소**에 아래 URL을 추가합니다.
   ```text
   https://github.com/redchupa/ha_good_tools
   ```
2. 목록에서 **Good Tools**를 찾아 **설치**한 뒤 **시작**합니다.
3. **사이드바에 표시** 옵션을 켜면 좌측 메뉴에서 바로 열 수 있습니다.

## 문서
- [개발 계획서 (DEVELOPMENT_PLAN.md)](DEVELOPMENT_PLAN.md)
- [진행 현황 및 인수인계 (PROGRESS.md)](PROGRESS.md)
- [앱 상세 문서 (good_tools/DOCS.md)](good_tools/DOCS.md)
- [변경 이력 (good_tools/CHANGELOG.md)](good_tools/CHANGELOG.md)
