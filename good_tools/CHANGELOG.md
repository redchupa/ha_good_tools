# Changelog

## 1.1.1 (2026-11-24)

- **업데이트 즉시 반영 개선**: `index.html`에 `Cache-Control: no-cache, no-store, must-revalidate` 헤더를 적용하여 HA 앱 업데이트 직후 강력 새로고침 없이 새 버전 UI가 바로 로드되도록 개선.

## 1.1.0 (2026-11-24)

- **Home Assistant 전용 도구 5종 추가**: 가족 공유 클립보드(`/data/clipboard.json`), HA YAML ↔ JSON 검사기, Cron & 스케줄 시뮬레이터, HA Jinja2 템플릿 모음, LAN 포트 점검 & Wake-on-LAN(`allow_lan_tools` 옵션 추가).
- **일상·파일·이미지 도구 5종 추가**: PDF 병합/분할/이미지→PDF(`pdf-lib` 로컬 처리), 이미지 리사이즈/포맷 변환/압축 & EXIF 제거, 단위·평수·D-Day/만나이 계산기, 정규표현식(Regex) 테스터 & 치환기, CSV/TSV ↔ JSON & 테이블 뷰어.
- **개발자·보안 도구 4종 추가**: Unix Timestamp ↔ KST/ISO 변환기, JSON 트리 & JSONPath 탐색기, SSL 인증서 만료 D-Day & HTTP 보안 헤더 진단기, SVG & Favicon/HA 아이콘 생성기.
- **플랫폼 & UX 업그레이드**: HA `/data/prefs.json` 기반 즐겨찾기·숨김 설정 서버 동기화, 도구 표시/숨기기 관리 모달, 한국어/English 언어 전환.

## 1.0.3 (2026-11-24)

- **UI 및 문서 정리**: 고정 도구 개수 표기 제거(향후 도구 확장에 유연하게 대응), README 후원 섹션 추가 및 안내 문구 정리.

## 1.0.2 (2026-11-24)

- **우편번호 조회 CDN 최신화**: 2026-11-30 종료 예정인 `t1.daumcdn.net` 도메인을 최신 카카오 우편번호 CDN(`t1.kakaocdn.net`)으로 교체.

## 1.0.1 (2026-11-24)

- **Docker 빌드 오류 수정**: `NODE_ENV=production`을 프론트엔드 빌드 이후로 이동하고 `--include=dev`를 명시하여 `tsc`/`vite` 누락(`exit code 127`) 해결.
- **Alpine Linux (musl) 호환성 개선**: `.dockerignore` 추가 및 Windows 생성 `package-lock.json` 제외로 컨테이너 내 플랫폼별 네이티브 패키지 해석 안정화.

## 1.0.0 (2026-11-24)

- **최초 릴리즈**: React 19, TypeScript, Tailwind CSS v4, Node.js Express 기반 Home Assistant 올인원 온라인 유틸리티 앱 출시.
- **일반 도구**: 특수문자표, 아스키아트 생성(텍스트+이미지), GIF 생성기, 바코드/QR 생성기(Wi-Fi QR 포함), Markdown 웹 에디터, 자막 변환기(SMI/SRT/VTT + 싱크 이동), 글자수 세기, 한영타 변환기, 매직아이 생성기, TTS, EML 뷰어, 원주소 변환기, IP/DNS/CIDR 조회, 로또 번호 생성기, 화면 손전등(SOS/WakeLock), 우편번호 조회, 바코드/QR 스캐너(이미지+카메라), 파일 체크섬 조회(MD5/SHA/CRC32), STT.
- **개발자 도구**: HTML 코드표, 아스키 코드표, 색상표 & WCAG 명암비 검사기, 이미지↔Data URL, 코드/문서 Diff 비교, 코드 정렬(JSON/JS/HTML/CSS/SQL/YAML), 코드 압축, 인코딩 & JWT 디코더, UUID v4/v7·ULID·NanoID 생성기, 키보드 이벤트 검사, 원격 HTML 소스 & 실시간 미리보기, AES-256/HMAC/비밀번호 보안 도구.
- **웹/피드 도구**: CORS 우회 RSS/Atom 피드 리더 및 `/data/feeds.json` 영속 저장.
- **보안 & HA 통합**: Home Assistant Ingress 완벽 지원, SSRF 방어 프록시, 다크/라이트/시스템 테마, `Ctrl+K` 빠른 검색, 즐겨찾기 지원.
