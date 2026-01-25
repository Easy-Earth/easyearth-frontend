export const BADGE_ITEMS = [
  {
    id: "legendary-1",       
    grade: "legendary",
    name: "지구 수호자",
    description: "누적 CO₂ 절감 목표를 달성한 증표",
    price: 1200,
  },
];

export function getBadgeItem(badgeId) {
  if (!badgeId) return null;
  return BADGE_ITEMS.find((it) => it.id === badgeId) ?? null;
}
