import { memo, useMemo } from "react";
import { getTitleBgPresetById } from "../../shared/constants/profileBackgrounds";
import { TITLE_LIST } from "../../shared/constants/titles";
import styles from "./Profile.module.css";

const Profile = ({ 
  presetId = "normal-1", 
  userName = "Name", 
  profileImage, 
  badgeImage
}) => {
  const result = useMemo(() => getTitleBgPresetById(presetId), [presetId]);
  
  const titleData = useMemo(() => {
    if (!presetId) return null;
    const [grade, idx] = presetId.split("-");
    return TITLE_LIST[grade][parseInt(idx) - 1];
  }, [presetId]);

  if (!result || !titleData) return null;

  const { grade, preset } = result;

  const styleVars = {
    "--g1": preset.g1,
    "--g2": preset.g2,
    "--ring": preset.ring,
  };

  return (
    <div className={`${styles.badgeCard} ${styles[grade]}`} style={styleVars}>
      <div className={styles.badgeGlow} />
      {grade === "legendary" && <div className={styles.rays} />}
      
      <div className={styles.badgeContent}>
        <div className={styles.leftSide}>
          <div className={styles.profileCircle}>
            {profileImage ? <img src={profileImage} alt="" /> : <span>{userName[0]}</span>}
          </div>
        </div>

        <div className={styles.rightSide}>
          {/* 칭호 영역: 설명 없이 타이틀만 강조 */}
          <div className={styles.titleArea}>
            <div className={styles.mainTitle}>{titleData.title}</div>
          </div>
          
          <div className={styles.userRow}>
            <div className={styles.massiveBadgeContainer}>
              {badgeImage && <img src={badgeImage} className={styles.massiveBadge} alt="" />}
            </div>
            <span className={styles.userName}>{userName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Profile);