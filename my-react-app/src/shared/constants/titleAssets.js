import tNormal1 from "@/assets/titles/normal/normal-1.png";

export const TITLE_ASSETS = {
  "normal-1": tNormal1

};

export function getTitleAsset(titleId) {
  return TITLE_ASSETS[titleId] ?? null;
}
