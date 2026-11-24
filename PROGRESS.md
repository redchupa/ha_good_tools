# HA Good Tools — 진행 현황 & 인수인계 (PROGRESS / HANDOFF)

> **이 문서는 작업 중단(사용량 제한 등) 시 다른 모델이나 세션이 즉시 작업을 이어받을 수 있도록 매 마일스톤마다 갱신됩니다.**

- **최종 갱신일** 2026-11-24 KST
- **현재 작업** v1.5.0 리뷰 결함 수정, 파일 변환기·인코더 업그레이드
- **GitHub 저장소**: `https://github.com/redchupa/ha_good_tools`
- **테스트 대상 HA (서브 HA)**: `http://192.168.1.129` (**주의: 메인 HA 192.168.1.118 및 nrgnc-ha MCP 절대 사용 금지**)

## v1.5.0 개발 (Claude 리뷰 반영)

- 근거 문서: [CLAUDE_REVIEW_v1.4.1.md](CLAUDE_REVIEW_v1.4.1.md). H1·H2·M1·M2, L1~L6, G1~G3·G5 대응과 개선안 A·B·C, 차순위(HA 사용자 ID 안내)를 모두 반영했습니다.
- 신규: 파일 변환기(`file-convert`, PDF→JPG·PNG·WebP, 이미지 형식·크기, 이미지→PDF, ZIP 저장). 인코더를 형식 간 변환기로 교체(Plain·URL·HTML·Base64·Base64URL·ASCII Hex·Hex·8/2/10진수·Unicode·Gzip·Zlib·Deflate, 자동 감지, JWT 만료 표시).
- 서버: 메모 고정 보존(고정 20 + 일반 50), 메모 수정 `PATCH` + `rev` 충돌 409, prefs `PATCH {add, remove}` 병합과 `rev`, 손상 파일 `*.corrupt-<시각>.json` 격리 + `/api/health`의 `recovered`, LAN 점검에서 172.30.32.0/23 제외, HA 403 응답에 본인 사용자 ID.
- 배포: 같은 버전 재게시 차단, 아키텍처별 QEMU 실행 health·버전 확인 후 태그 생성, 버전 문자열 4곳 일치 검사, `release-guard.yml`(이미지 없는 버전 상향 차단).
- 서브 HA 검증(작업 트리, SSH 계정 `nrgnc`): 백엔드 16/16, 프론트 21/21, TypeScript·Vite 빌드, npm audit 두 범위 0건, Chromium 모바일 E2E(같은 파일 재선택, 변환기 PDF→PNG·ZIP·PNG→JPG, 인코더, LAN IP HTTP에서 AES 왕복·HMAC·사용 불가 표시) 통과. 초기 JS gzip 106.81 kB.
- SSH 컨테이너에는 Node·npm·Chromium이 기본 설치되어 있지 않습니다. 검증 전에 `sudo apk add nodejs npm chromium`이 필요하며 앱 재시작 시 사라집니다.

## v1.4.1 배포 검증

- 서브 HA에서 백엔드 12/12·프론트 14/14, npm audit 두 범위 0건, 프로덕션 빌드 및 Chromium 모바일 뷰 E2E를 통과했습니다. 초기 JS gzip은 104.45 kB입니다.
- 실제 Ingress에서 허용된 계정의 엔티티 검색과 Jinja 평가(42), 사용자 목록에서 제거한 후 403, 환율 기준일·응답을 확인했습니다. 알림 서비스는 모의 호출로 고정 대상을 검증했습니다.
- 격리된 QA 설치에서 1.3.3 백업 → GHCR 1.4.0 업데이트 → 백업 복원 후 1.3.3 health 응답을 확인했습니다. 실제 서브 HA 설치에서도 1.3.3 → 1.4.0 업데이트와 50개 JS 청크를 확인했습니다.
- 기존 공유 경로의 404를 발견해 1.4.1에서 `/app/<slug>?tool=<id>`로 수정했습니다. 서브 HA 브라우저에서 해당 링크가 체크섬 도구를 선택하는 것을 확인했습니다.
- 정식 후보 1.4.1의 amd64·arm64·arm/v7 manifest 익명 조회 및 서브 HA GHCR 업데이트를 확인했습니다. 최종 health 1.4.1, Supervisor started, 도구 JS 50개 정상 응답, 실제 앱의 복사 버튼으로 얻은 링크 재접속까지 통과했습니다.
- 서브 HA 전용 검증 스크립트 및 GitHub Actions 패키징을 분리했습니다. GitHub-hosted runner는 서브 HA 자격 증명을 갖지 않습니다. ARM 하드웨어와 실제 iOS·Android Companion 앱은 검증하지 않았습니다.

## v1.4.0 제품 개선

서브 HA에서 백엔드 12개, 프론트엔드 13개 테스트 및 TypeScript·Vite 빌드를 확인했습니다. 같은 장비의 Chromium에서 체크섬 벡터·50 MiB 파일 취소·PDF 추출·최근 도구·룰렛 상태를 검증했습니다. 실제 iPhone 및 Android Companion 하드웨어 검증은 후속 항목입니다.

## v1.3.3 품질·보안 감사

- SSRF·TLS 연결, Ingress 및 LAN 요청 제한, 공유 파일 트랜잭션, 비동기 예외 처리, 정규식·CSV·크론, Blob URL 및 장치 리소스 수명, Docker 빌드와 의존성을 수정했습니다.
- 서브 HA 192.168.1.129에서 새 잠금 파일로 의존성을 설치하고 프로덕션 웹 빌드, 백엔드 테스트 11/11, 웹 테스트 10/10, npm audit 0건을 확인했습니다. 메인 HA는 사용하지 않았습니다.
- 서브 HA Supervisor에서 격리된 QA 앱을 빌드·기동하고 인증된 Ingress로 메인 HTML, health(1.3.3)와 도구 JS 50개가 정상 응답하는 것을 확인했습니다.
- 구현 커밋 `831583d` 푸시 후 서브 HA의 기존 설치를 1.3.1에서 1.3.3으로 업데이트했습니다. Supervisor started, Ingress health 1.3.3, HTML 및 도구 청크 50개를 재확인하고 임시 QA 앱·테스트 디렉터리를 정리했습니다.
- [v1.3.3 릴리스](https://github.com/redchupa/ha_good_tools/releases/tag/v1.3.3)
- 전체 심각도 표, 미검증 범위, 제품 우선순위와 완료 기준은 [코드 감사 및 개선안](REVIEW_HANDOFF.md#6-v133-코드-감사)에 있습니다. ARM 및 Companion 실기기 결과는 열려 있습니다.

## 릴리즈 이력
- [x] **v1.0.0 ~ v1.0.3**: 초기 도구 세트 구축, Docker 빌드 수정, 카카오 우편번호 CDN 최신화(`t1.kakaocdn.net`), 후원 섹션 추가, 서브 HA Ingress 전체 E2E 검증 통과
- [x] **v1.1.0**: 신규 도구 14종 + 플랫폼 UX 3종 확장 완료 (총 46종 도구, 백엔드 테스트 8/8, 프론트엔드 테스트 7/7, 빌드 0 에러)

## v1.1.0 확장 개발 체크리스트
- [x] **Step 1**: v1.1.0 개발 계획서(`DEVELOPMENT_PLAN.md`) 및 `PROGRESS.md` 갱신
- [x] **Step 2**: 백엔드 API 확장 (`/api/prefs`, `/api/clipboard`, `/api/wol`, `/api/port-check`, `/api/ssl-check`) + `config.yaml`(`allow_lan_tools`) + 서버 단위 테스트 (8/8 통과)
- [x] **Step 3**: `pdf-lib` 설치 및 UI 셸 업그레이드 (`ha` 카테고리, `/api/prefs` 서버 동기화, 도구 숨기기/관리 모달, KO/EN 언어 전환)
- [x] **Step 4**: Home Assistant 전용 도구 5종 (`shared-clipboard`, `ha-yaml-json`, `ha-cron`, `ha-jinja`, `lan-wol`)
- [x] **Step 5**: 일상·파일·이미지 도구 5종 (`pdf-tools`, `image-studio`, `unit-date-calc`, `regex-tester`, `csv-json`)
- [x] **Step 6**: 개발자·보안 도구 4종 (`timestamp-conv`, `json-explorer`, `ssl-checker`, `favicon-gen`)
- [x] **Step 7**: `v1.1.0` 릴리즈 및 서브 HA(`http://192.168.1.129`) 업데이트·신규 14종 도구 + UX 3종 전 항목 실동작 검증 통과 (`v1.1.1`에 `index.html` no-cache 개선 반영)

## 검증 명령어
- 백엔드 테스트: `cd good_tools/server && npm test` (11/11 pass)
- 프론트엔드 빌드 & 테스트: `cd good_tools/web && npm run build && npm test` (0 errors, 10/10 pass)
