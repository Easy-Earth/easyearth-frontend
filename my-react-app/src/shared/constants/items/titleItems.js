export const TITLE_ITEMS = [
  {
    id: "normal-1",            
    grade: "normal",
    name: "에코 입문자",
    description: "환경 보호를 처음 시작한 사용자",
    price: 0,
  },
  // 나머지 계속 추가
];

export function getTitleItem(titleId) {
  if (!titleId) return null;
  return TITLE_ITEMS.find((it) => it.id === titleId) ?? null;
}
