import { memo, useMemo } from "react";
import { getBadgeAsset } from "../../shared/constants/badgeAssets";
import { TITLE_BG_PRESETS } from "../../shared/constants/profileBackgrounds";
import { getTitleAsset } from "../../shared/constants/titleAssets";
import styles from "./Profile.module.css";

function findPresetById(presetId) {
  if (!presetId) return null;
  const all = [
    ...(TITLE_BG_PRESETS.normal ?? []),
    ...(TITLE_BG_PRESETS.rare ?? []),
    ...(TITLE_BG_PRESETS.epic ?? []),
    ...(TITLE_BG_PRESETS.legendary ?? []),
  ];
  return all.find((p) => p.id === presetId) ?? null;
}

function getGradeFromPresetId(presetId) {
  if (!presetId) return "normal";
  if (presetId.startsWith("legendary-")) return "legendary";
  if (presetId.startsWith("epic-")) return "epic";
  if (presetId.startsWith("rare-")) return "rare";
  return "normal";
}

const Profile = ({
  presetId = "normal-1",
  profileImage,
  titleId,
  badgeId,
  userName,
}) => {
  const preset = useMemo(() => findPresetById(presetId), [presetId]);
  const grade = useMemo(() => getGradeFromPresetId(presetId), [presetId]);

  const styleVars = useMemo(() => {
    const p = preset ?? TITLE_BG_PRESETS.normal?.[0];
    return {
      "--g1": p?.g1,
      "--g2": p?.g2,
      "--g3": p?.g3,
      "--b1": p?.b1,
      "--b2": p?.b2,
      "--ring": p?.ring,
    };
  }, [preset]);

  const titleImage = useMemo(() => getTitleAsset(titleId), [titleId]);
  const badgeImage = useMemo(() => getBadgeAsset(badgeId), [badgeId]);

  return (
    <div className={`${styles.profile} ${styles[grade]}`} style={styleVars}>
      <div className={styles.bgGlow} aria-hidden="true" />
      <div className={styles.frame} aria-hidden="true" />
      <div className={styles.shimmer} aria-hidden="true" />
      <div className={styles.rays} aria-hidden="true" />
      <div className={styles.ring} aria-hidden="true" />

      <div className={styles.sparkles} aria-hidden="true">
        <span />
        <span />
        <span />
        <span />
      </div>

      <div className={styles.content}>
        <div className={styles.left}>
          <img
            src={profileImage}
            alt="profile"
            className={styles.profileImage}
          />
        </div>

        <div className={styles.right}>
          {titleImage ? (
            <img src={titleImage} alt="title" className={styles.title} />
          ) : (
            <div className={styles.titlePlaceholder} />
          )}

          <div className={styles.bottomRow}>
            {badgeImage ? (
              <img src={badgeImage} alt="badge" className={styles.badge} />
            ) : (
              <div className={styles.badgePlaceholder} />
            )}
            <div className={styles.userName}>{userName}</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Profile);
