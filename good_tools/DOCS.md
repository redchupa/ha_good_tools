# Good Tools 사용 안내

Home Assistant 사이드바에서 다양한 일상·HA 전용·개발자·피드 도구를 바로 사용할 수 있는 올인원 유틸리티 앱입니다.

## 설정 옵션

| 옵션 | 기본값 | 설명 |
|---|---|---|
| `log_level` | `info` | 서버 로그 출력 수준 (`debug`, `info`, `warning`, `error`) |
| `allow_network_tools` | `true` | 원주소 변환기, IP/DNS 조회, 원격 HTML 소스 보기, SSL 인증서 진단, RSS 리더 등 서버 프록시 기능 활성화 여부 |
| `allow_lan_tools` | `true` | 내부 네트워크 TCP 포트 점검 및 Wake-on-LAN(WoL) 기능 활성화 여부 |
| `default_theme` | `system` | 기본 테마 설정 (`system`, `light`, `dark`) |

## 보안 및 영속 저장

- PDF 병합/분할, 이미지 압축/EXIF 제거, 파일 체크섬, EML 뷰어, GIF 생성기, 암호화 도구 등은 **100% 브라우저 내부**에서 처리됩니다.
- 외부 네트워크 프록시 도구는 사설 IP(`127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.0.0/16`, `.local`) 접근을 차단하는 SSRF 방어가 적용되어 있습니다.
- 즐겨찾기·숨긴 도구·언어 설정(`/data/prefs.json`), 가족 공유 클립보드(`/data/clipboard.json`), RSS 피드 목록(`/data/feeds.json`)은 앱 영속 볼륨에 저장되어 PC와 모바일 HA 앱 간 동기화됩니다.
