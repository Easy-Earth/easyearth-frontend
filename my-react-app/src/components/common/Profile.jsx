import { memo, useMemo, useEffect, useState } from "react";
import * as itemApi from "../../apis/itemApi";
import { TITLE_BG_PRESETS } from "../../utils/profileBackgrounds";
import { TITLE_LIST } from "../../shared/constants/titles";
import styles from "./Profile.module.css";

const Profile = ({ 
  memberId, 
  userName = "Name", 
  profileImage 
}) => {
  const [equippedIds, setEquippedIds] = useState([]);

  useEffect(() => {
    // memberId가 없으면 아예 호출 안 함 (첫 렌더링 방어)
    if (!memberId || memberId === "undefined") return;

    const fetchEquipped = async () => {
      try {
        const data = await itemApi.getEquippedItems(memberId);
        setEquippedIds(data);
      } catch (err) {
        setEquippedIds([]);
      }
    };

    fetchEquipped();
  }, [memberId]);

  // 배경 프리셋 계산
  const bgData = useMemo(() => {
    const defaultData = { grade: "common", preset: TITLE_BG_PRESETS?.common?.[0] || {} };
    if (!equippedIds.length) return defaultData;

    const bgId = equippedIds.find(id => id >= 51 && id <= 90);
    const grades = ["common", "rare", "epic", "legendary"];
    
    if (bgId) {
      const offset = bgId - 51;
      const gradeIdx = Math.floor(offset / 10);
      const itemIdx = offset % 10;
      const targetGrade = grades[gradeIdx] || "common";
      const preset = TITLE_BG_PRESETS?.[targetGrade]?.[itemIdx];
      if (preset) return { grade: targetGrade, preset };
    }
    return defaultData;
  }, [equippedIds]);

  // 칭호 리스트 계산
  const titleData = useMemo(() => {
    const defaultTitle = TITLE_LIST?.common?.[0] || { title: "에코 꿈나무" };
    if (!equippedIds.length) return defaultTitle;

    const titleId = equippedIds.find(id => id >= 91 && id <= 130);
    const grades = ["common", "rare", "epic", "legendary"];
    
    if (titleId) {
      const offset = titleId - 91;
      const gradeIdx = Math.floor(offset / 10);
      const itemIdx = offset % 10;
      const targetGrade = grades[gradeIdx] || "common";
      return TITLE_LIST?.[targetGrade]?.[itemIdx] || defaultTitle;
    }
    return defaultTitle;
  }, [equippedIds]);

  // 뱃지 이미지 계산
  const badgeImage = useMemo(() => {
    const badgeId = equippedIds.find(id => id >= 1 && id <= 50);
    if (!badgeId) return null;
    const formattedId = String(badgeId).padStart(2, '0');
    const rarity = ["common", "rare", "epic", "legendary"][Math.floor((badgeId - 1) / 10)] || "common";
    try {
      return new URL(`../../assets/badges/${rarity}/badge_${formattedId}.png`, import.meta.url).href;
    } catch { return null; }
  }, [equippedIds]);

  const { grade, preset } = bgData;
  const styleVars = useMemo(() => ({
    "--g1": preset?.g1,
    "--g2": preset?.g2,
    "--g3": preset?.g3,
    "--b1": preset?.b1,
    "--b2": preset?.b2,
    "--ring": preset?.ring,
    "--ring-rgb": preset?.ring?.includes("rgba") 
      ? preset.ring.replace("rgba(", "").replace(")", "").split(",").slice(0, 3).join(",") 
      : "255,255,255"
  }), [preset]);

  return (
    <div className={`${styles.badgeCard} ${styles[grade]} ${styles.isBackgroundOnly}`} style={styleVars}>
      <div className={styles.badgeGlow} />
      {grade === "legendary" && <div className={styles.rays} />}
      {grade === "legendary" && <div className={styles.ring} />}
      
      <div className={styles.badgeContent}>
        <div className={styles.leftSide}>
          <div className={styles.profileCircle}>
            {profileImage ? (
              <img src={profileImage} alt="Profile" className={styles.profileImg} />
            ) : (
              <span className={styles.initial}>{userName?.[0] || "?"}</span>
            )}
          </div>
        </div>
        <div className={styles.rightSide}>
          <div className={`${styles.titleArea} ${styles.isTitleOnly}`}>
            <div className={styles.mainTitle}>{titleData.title}</div>
          </div>
          <div className={styles.userRow}>
            <div className={styles.massiveBadgeContainer}>
              {badgeImage && <img src={badgeImage} className={styles.massiveBadge} alt="Badge" />}
            </div>
            <span className={styles.userName}>{userName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Profile);