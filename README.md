# 🧰 Good Tools for Home Assistant

[![Open your Home Assistant instance and show the add add-on repository dialog with a specific repository URL pre-filled.](https://my.home-assistant.io/badges/supervisor_add_addon_repository.svg)](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fredchupa%2Fha_good_tools)

> **광고도, 회원가입도, 개인정보 유출 걱정도 없는 나만의 Home Assistant 올인원 만능 도구함!**

인터넷에서 PDF 합치기, 사진 용량 줄이기, QR코드 만들기, 글자수 세기 같은 도구를 찾을 때마다 덕지덕지 붙은 광고와 수상한 사이트 때문에 불편하셨나요?  
**Good Tools**는 일상에서 자주 쓰는 실용 도구부터 스마트홈 관리 도구까지 한곳에 모아, **Home Assistant 사이드바에서 클릭 한 번으로** 바로 꺼내 쓸 수 있게 만든 무료 앱입니다.

---

## ✨ 설치하면 이렇게 보입니다

### 한눈에 보는 메인 대시보드
카테고리 필터, 실시간 검색(`Ctrl+K`), 즐겨찾기, 다크/라이트 모드, 한국어/영어 전환, 안 쓰는 도구 숨기기까지 깔끔하게 정리되어 있습니다.

<p align="center">
  <img src="https://raw.githubusercontent.com/redchupa/ha_good_tools/main/images/screenshot-home.png" alt="Good Tools 메인 화면" width="100%"/>
</p>

### 클릭 한 번으로 바로 쓰는 실용 도구
예시: **바코드 & QR 생성기** — 우리 집 Wi-Fi 자동 연결 QR코드나 웹사이트 QR코드를 1초 만에 만들고 이미지로 저장할 수 있습니다.

<p align="center">
  <img src="https://raw.githubusercontent.com/redchupa/ha_good_tools/main/images/screenshot-qr.png" alt="Good Tools 바코드 및 QR 생성기 화면" width="100%"/>
</p>

---

## 💡 왜 Good Tools를 쓰면 좋을까요?

- **광고 0%, 추적 0%**: 외부 광고나 팝업 없이 쾌적하고 빠르게 동작합니다.
- **내 집 안에서 안전하게 처리**: PDF 합치기, 사진 압축, 이메일 파일 열기 등 민감한 파일이 외부 서버로 올라가지 않고 내 기기에서 바로 처리됩니다.
- **PC와 스마트폰이 자동 연동**: 즐겨찾기, 숨긴 도구 설정, 가족 공유 클립보드가 Home Assistant에 저장되어 PC와 휴대폰 앱 어디서 열어도 그대로 이어집니다.
- **별도 로그인·포트 설정 불필요**: Home Assistant 사이드바에 등록해 두면 언제든 바로 열 수 있습니다.

---

## 🛠️ 이런 도구들이 들어 있어요

### 🏠 스마트홈 · 가족 생활
- **가족 공유 클립보드**: PC에서 복사한 링크나 메모를 휴대폰 HA 앱에서 바로 꺼내 쓰는 가족 공용 메모장
- **원격 PC 전원 켜기 & 기기 연결 점검**: 집 안 PC를 원격으로 켜거나(Wake-on-LAN) 기기 연결 상태 확인
- **Home Assistant 설정 도우미**: YAML 문법 검사, 예약 스케줄(Cron) 실행 시각 미리보기, 자주 쓰는 템플릿 모음

### 📄 문서 · 사진 · 일상
- **PDF 병합 / 분할 / 변환**: 여러 PDF를 하나로 합치거나 필요한 페이지만 쏙 뽑고, 사진을 PDF로 변환
- **사진 용량 줄이기 & 위치정보 삭제**: 사진 크기 조절, 파일 형식 변환(WebP/JPG/PNG)과 함께 촬영 위치정보를 깔끔하게 제거
- **바코드 & QR 생성기 / 스캐너**: 손님용 Wi-Fi QR코드 생성, 사진 파일이나 카메라로 QR·바코드 스캔
- **단위 · 평수 · 날짜 계산기**: 아파트 평수↔㎡, 온도·길이·무게 변환, D-Day 및 만 나이 계산
- **글자수 세기 & 한영타 변환기**: 자소서·문서 글자수 실시간 계산, `dkssud` → `안녕` 오타 즉시 복구
- **우편번호 조회**: 도로명주소·지번주소·영문주소·5자리 우편번호 검색 및 원클릭 복사
- **그 외 일상 도구**: GIF 움짤 만들기, 자막 변환(SMI↔SRT↔VTT), 특수문자·이모지표, 로또 번호 생성기, 화면 손전등(SOS), EML 이메일 뷰어, 단축 URL 원주소 확인, 글 읽어주기(TTS) / 받아쓰기(STT), 매직아이·아스키아트 생성, 웹 메모장

### 💻 고급 · 업무 · 피드 도구
- **표 & 문서 도구**: 엑셀(CSV) 표 보기·변환, 문서 차이점 비교, 패턴 찾기·마스킹(정규식), 파일 위변조 확인(체크섬)
- **웹·네트워크 도구**: 내 공인 IP·위치 조회, 웹사이트 보안 인증서 만료일 확인, HTML 소스·미리보기, 아이콘/Favicon 만들기
- **개발·보안 도구**: 색상표 및 가독성 검사, 코드 자동 정렬/압축, 인코딩·암호화, 안전한 비밀번호 생성기, 고유 ID(UUID) 생성기, 시간(Timestamp) 변환기
- **RSS 뉴스·블로그 리더**: 즐겨보는 블로그나 Home Assistant 소식을 한곳에서 구독

---

## 🚀 1분 만에 설치하기

1. 상단의 **Add Repository** 파란 버튼을 클릭하거나, Home Assistant의  
   **설정 → 앱(애드온) → 앱 스토어 → 우측 상단 점 3개(⋮) → 저장소**에 아래 주소를 추가합니다.
   ```text
   https://github.com/redchupa/ha_good_tools
   ```
2. 앱 스토어 목록에서 **Good Tools**를 찾아 **설치**한 뒤 **시작**을 누릅니다.
3. **사이드바에 표시**를 켜면 왼쪽 메뉴에서 바로 사용할 수 있습니다!

---

## ☕ 후원

이 앱이 도움이 되셨다면 따뜻한 커피 한 잔으로 응원해 주세요 🙏  
*(본 프로젝트의 모든 기능은 100% 무료로 제공되며, 후원은 순수 자발적 응원 목적입니다.)*

<table>
  <tr>
    <td align="center">
      <b>토스 (Toss)</b><br/>
      <img src="https://raw.githubusercontent.com/redchupa/ha_good_tools/main/images/toss-donation.png" alt="Toss 후원 QR" width="200"/><br/>
      <code>1000-1261-7813</code> (우*만)
    </td>
    <td align="center">
      <b>PayPal</b><br/>
      <img src="https://raw.githubusercontent.com/redchupa/ha_good_tools/main/images/paypal-donation.png" alt="PayPal 후원 QR" width="200"/>
    </td>
  </tr>
</table>

<p align="center">
  <a href="https://github.com/sponsors/redchupa"><img src="https://img.shields.io/badge/GitHub_Sponsors-❤️-pink?style=for-the-badge&logo=githubsponsors" alt="GitHub Sponsors"></a>
  <a href="https://www.paypal.com/ncp/payment/HG9KNC262PLAC"><img src="https://img.shields.io/badge/PayPal-후원-00457C?style=for-the-badge&logo=paypal&logoColor=white" alt="PayPal"></a>
</p>
