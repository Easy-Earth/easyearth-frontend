import { memo, useMemo } from "react";
import { getTitleBgPresetById } from "../../utils/profileBackgrounds";
import styles from "./Profile.module.css";

const Profile = ({ 
  presetId = "common-1", 
  userName = "Name", 
  profileImage, 
  badgeImage ,   
  // titleImage    
}) => {
  const result = useMemo(() => getTitleBgPresetById(presetId), [presetId]);
  if (!result) return null;

  const { grade, preset } = result;
  
  const fxValues = { common: 0.20, rare: 0.55, epic: 0.85, legendary: 1.25 };
  const currentFx = fxValues[grade] || 0.2;

  const styleVars = {
    "--g1": preset.g1, "--g2": preset.g2, "--g3": preset.g3,
    "--b1": preset.b1, "--b2": preset.b2, "--ring": preset.ring,
    "--fx": currentFx,
  };

  return (
    <div className={`${styles.badgeCard} ${styles[grade]} ${styles.badgeSelected}`} style={styleVars}>
      {/* 배경 특수효과 레이어 (님 코드 이식) */}
      <div className={styles.badgeGlow} />
      <div className={styles.rays} />
      <div className={styles.shimmer} />
      <div className={styles.ring} />
      <div className={styles.badgeFrame} />
      
      <div className={styles.sparkles}>
        {[...Array(6)].map((_, i) => <span key={i} />)}
      </div>

      <div className={styles.badgeContent}>
        {/* 왼쪽 프로필 (고정 크기) */}
        <div className={styles.leftSide}>
          <div className={styles.profileCircle}>
            {profileImage ? <img src={profileImage} alt="" /> : <span>{userName[0]}</span>}
          </div>
        </div>

        {/* 오른쪽 칭호 + [대형 배지 & 이름] */}
        <div className={styles.rightSide}>
          <div className={styles.titleArea}>
            {/* {titleImage && <img src={titleImage} className={styles.titleImg} alt="" />} */}
          </div>
          
          <div className={styles.userRow}>
            {/* 모든 등급 공통: 대형 배지 (72px) */}
            <div className={styles.massiveBadgeContainer}>
              {/* {badgeImage && <img src={badgeImage} className={styles.massiveBadge} alt="" />} */}
              <div className={styles.badgeBackLight} />
            </div>
            <span className={styles.userName}>{userName}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Profile);