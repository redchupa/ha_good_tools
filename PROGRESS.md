# HA Good Tools — 진행 현황 & 인수인계 (PROGRESS / HANDOFF)

> **이 문서는 작업 중단(사용량 제한 등) 시 다른 모델이나 세션이 즉시 작업을 이어받을 수 있도록 매 마일스톤마다 갱신됩니다.**

- **최종 갱신 시각**: 2026-11-24 13:14 (KST)
- **현재 상태**: `v1.1.0 개발·빌드·단위테스트 완료 -> GitHub 릴리즈 및 서브 HA(192.168.1.129) 최종 검증 진행 중`
- **GitHub 저장소**: `https://github.com/redchupa/ha_good_tools`
- **테스트 대상 HA (서브 HA)**: `http://192.168.1.129` (**주의: 메인 HA 192.168.1.118 및 nrgnc-ha MCP 절대 사용 금지**)

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
- [ ] **Step 7**: `v1.1.0` GitHub Release 발행 및 서브 HA(`http://192.168.1.129`) 업데이트·신규 기능 실동작 검증

## 검증 명령어
- 백엔드 테스트: `cd good_tools/server && npm test` (8/8 pass)
- 프론트엔드 빌드 & 테스트: `cd good_tools/web && npm run build && npm test` (0 errors, 7/7 pass)
