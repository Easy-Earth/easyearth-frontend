# 🌱 Eco-Life Web (Frontend)

친환경 생활 실천을 돕는 웹 서비스의 프론트엔드 레포지토리입니다.  
사용자는 일일 미션, 출석 체크, 친환경 지도, 탄소 절감 현황 등을 통해  
환경 보호 활동을 기록 · 시각화 · 지속할 수 있습니다.

# 🌏 프로젝트 비전

환경 보호는 거창한 행동이 아니라
매일의 작은 실천에서 시작된다.

---
# 👨‍💻팀원

유지훈 / 김지환 / 김재형 / 조주현 / 황선욱
---

## 📌 프로젝트 개요

- 프로젝트 주제: 친환경 생활 실천 & 탄소 절감 플랫폼
- 목표
  - 일상 속 친환경 행동을 미션/출석 형태로 유도
  - 사용자 행동을 탄소 절감 수치로 시각화
  - 친환경 시설(리필샵, 제로웨이스트샵, 충전소 등)을 지도 기반으로 제공

---

## 🧩 주요 기능

- 메인 페이지
  - 오늘의 날씨 + 행동 추천
  - 이번 주 목표 진행률(Progress Bar)
  - 일일 퀘스트(체크박스 기반)
  - 임팩트 대시보드(누적 탄소 절감 지표)

- 친환경 지도
  - 리필스테이션 / 제로웨이스트샵 / 재활용 수거함 위치 표시
  - 카테고리 필터 토글 UI

- 출석 체크
  - 화면 고정 버튼 → 확장형 UI
  - 연속 출석 기록 관리

- 미션 & 챌린지
  - 랜덤 일일 미션 제공
  - 수행 결과에 따른 환경 기여도 계산

---

## 🛠 기술 스택

- React (Vite)
- JavaScript (ES6+)
- CSS (Token 기반 스타일 관리)
- ESLint
- Git / GitHub

### 성능 최적화
- React.memo
- useMemo
- useCallback

---
🐛 이슈 & PR 규칙

- 모든 작업은 반드시 이슈 생성 후 진행합니다.
- PR 생성 전 아래 규칙으로 브랜치를 생성합니다.

**[label]/[변동사항]**

label 종류
[FEAT] , [FIX] , [REFACTOR] , [STYLE] , [CHORE] , [DOCS] , [COMPONENT] , [TEST]

브랜치 예시

feat/mission-carousel
fix/header-layout
refactor/home-components

- PR 생성 전 반드시 이슈를 먼저 생성합니다.
- PR은 생성한 이슈를 반드시 참조합니다.
- PR 생성 후 2명 이상 승인(Approve)을 받아야 merge 가능합니다.
---
## 📂 폴더 구조

```txt
src/
├─ assets/
├─ components/
│  ├─ common/
│  ├─ layout/
│  └─ home/
├─ pages/
│  ├─ Home/
│  ├─ Map/
│  ├─ Missions/
│  ├─ Attendance/
│  └─ NotFound/
├─ hooks/
├─ styles/
│  ├─ reset.css
│  ├─ global.css
│  └─ tokens/
│     ├─ colors.js
│     └─ typography.js
├─ utils/
├─ App.jsx
└─ main.jsx

---