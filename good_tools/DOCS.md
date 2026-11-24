# Good Tools 사용 안내

Home Assistant 사이드바에서 32가지 일상·개발자·피드 도구를 바로 사용할 수 있는 올인원 유틸리티 앱입니다.

## 설정 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `log_level` | `info` | 서버 로그 출력 수준 (`debug`, `info`, `warning`, `error`) |
| `allow_network_tools` | `true` | 원주소 변환기, IP/DNS 조회, 원격 HTML 소스 보기, RSS 리더 등 서버 프록시 기능 활성화 여부 |
| `default_theme` | `system` | 기본 테마 설정 (`system`, `light`, `dark`) |

## 보안 및 프라이버시

- 파일 체크섬, EML 뷰어, GIF 생성기, 암호화 도구, 코드 비교/정렬 등 28개 도구는 **100% 브라우저 내부**에서 처리됩니다.
- 서버 프록시 도구(`allow_network_tools: true`)는 내부 사설 IP(`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `.local`) 접근을 차단하는 SSRF 방어 로직이 적용되어 있습니다.
- RSS 피드 즐겨찾기 목록은 앱 영속 볼륨(`/data/feeds.json`)에 저장됩니다.

## HTTPS 환경 참고 사항

- **음성 문자 변환 (STT)** 및 **바코드 스캐너의 실시간 카메라 모드**는 브라우저 보안 정책상 HTTPS(예: Nabu Casa, Cloudflare Tunnel, 리버스 프록시) 또는 `localhost` 접속 시 활성화됩니다.
- 일반 HTTP 로컬 접속 환경에서도 **바코드 스캐너의 이미지 파일 업로드 스캔** 및 나머지 모든 도구는 정상 동작합니다.
