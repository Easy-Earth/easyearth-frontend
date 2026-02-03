// src/shared/constants/seoulThemes.js
export const SEOUL_THEMES = [
  { id: "1741228380725" , label : "서울 야경명소" , color : "#f19bf2"},
  { id : "1723624111751", label : "매력가든‧동행가든", color : "#f0e8b3"},
  { id : "1681179124353", label : "기발한 별지도(운동 명소)", color : "#046565" , isArea : true},
  { id : "1684396695589", label : "기발한 별지도(키즈편)", color : "#ff4089", isArea: true},
  { id : "1649132420936", label : "폐의약품 전용수거함 위치", color : "#rgb(135, 151, 223)"},
  { id : "11102818", label : "서울로 트레킹 길", color : "#81abff" ,isArea:true},
  { id : "11103389", label : "폐건전기 폐형광등 분리수거함", color : "#00ff2f"},
  { id : "11101836", label : "생물다양성 현황", color : "#009255"},
  { id : "100273", label : "사진속 거울", color : "#ebd7fa"},
  { id : "100771", label : "서울시 자원회수시설", color : "#44077a"},
  { id : "11101844", label : "폐기물 관련 환경기초시설(공공)", color : "#d10404"},
  { id : "1765960848355", label : "[성북] 규격(특수)봉투 판매소", color : "#2a3264"},
  { id : "1765960271640", label : "[성북]도심 공원 즐기기", color : "#a6eaa3"},
  { id : "1755739898113", label : "용산구 재활용 의류수거함 정보", color : "#086b8c"},
  { id : "1741305884013", label : "강북감성길(놀러와 우리동네)", color : "#a1987a" , isArea : true},
  { id : "1732335864484", label : "서울형 치유의 숲길 조성", color : "#49ac22"},
  { id : "11101181", label : "차 없는 거리", color : "#1523bb" , isArea : true},
  { id : "1709085904880", label : "구로, 공원 함께 가요!!", color : "#483486"},
  { id : "1663564614080", label : "구로구 안양천명소 주요시설물", color : "#1bffce"},
  { id: "1657588761062", label: "(친환경)자전거 도로", color: "#10b981" }, 
  { id: "1693986134109", label: "[착한소비] 개인 컵 할인 카페", color: "#f59e0b" }, 
  { id: "11103395", label: "[착한소비] 제로웨이스트상점", color: "#3b82f6" }, 
  { id: "11101339", label: "녹색교통지역(범위)", color : "#2AB32d", isArea: true }, 
  { id: "100578", label: "우리동네약수터", color: "#06b6d4" }, 
  { id: "1730359504536", label: "재활용 정거장", color: "#a855f7" }, 
];

// ID로 색상을 찾기 위한 헬퍼 객체
export const THEME_COLOR_MAP = SEOUL_THEMES.reduce((acc, cur) => {
  acc[cur.id] = cur.color || "#666666";
  return acc;
}, {});