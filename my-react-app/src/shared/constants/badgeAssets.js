import legendary1 from "@/assets/badges/legendary/legendary-1.png";

export const BADGE_PRESETS = {
  "legendary-1": legendary1,
};

export function getBadgeAsset(badgeId) {
  if (!badgeId) return null;
  return BADGE_PRESETS[badgeId] ?? null;
}
