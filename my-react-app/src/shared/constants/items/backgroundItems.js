export const BACKGROUND_ITEMS = [
  {
    id: "legendary-6",         // ✅ profileBackgrounds.js presetId와 동일
    grade: "legendary",
    name: "오로라 민트",
    description: "최상급 유저를 위한 빛의 그라데이션",
    price: 1800,
  },
];

export function getBackgroundItem(presetId) {
  if (!presetId) return null;
  return BACKGROUND_ITEMS.find((it) => it.id === presetId) ?? null;
}
