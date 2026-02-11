// 지금까지 만든 배지 데이터 매칭 (예시)
export const getBadgeImage = (badgeId) => {
  if (!badgeId) return null;
  if (badgeId <= 10) return `/src/assets/badges/common/badge_${String(badgeId).padStart(2, '0')}.png`;
  if (badgeId <= 20) return `/src/assets/badges/rare/badge_${badgeId}.png`;
  if (badgeId <= 30) return `/src/assets/badges/epic/badge_${badgeId}.png`;
  return `/src/assets/badges/legendary/badge_${badgeId}.png`;
};

// 칭호 이미지 매칭 (칭호도 가로로 길다고 하셨으니 그에 맞는 에셋 경로)
export const getTitleImage = (titleId) => {
  if (!titleId) return null;
  // 임시로 등급별 타이틀 이미지가 있다고 가정
  return `/src/assets/titles/title_${titleId}.png`;
};