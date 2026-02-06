import axios from "axios";
import { memo, useEffect, useMemo, useState } from "react";
import "../../styles/itemEffects.css";
import { getTitleBgPresetById } from "../../utils/profileBackgrounds";
import { TITLE_LIST } from "../../utils/profileTitles";
import styles from "./Profile.module.css";

const Profile = ({ size = "big", memberId, userName = "사용자" }) => {
  const [equippedIds, setEquippedIds] = useState([]);

  useEffect(() => {
    const fetchEquipped = async () => {
      if (!memberId) return;
      try {
        const response = await axios.get(`http://localhost:8080/spring/member/equipped/${memberId}`);
        const data = Array.isArray(response.data) ? response.data : [];
        setEquippedIds(data.map(Number)); 
      } catch (e) {
        console.error("데이터 로드 실패:", e);
        setEquippedIds([]);
      }
    };
    fetchEquipped();
  }, [memberId]);

  const { badgeId, bgId, titleId } = useMemo(() => ({
    badgeId: equippedIds.find(id => id >= 1 && id <= 50),
    bgId: equippedIds.find(id => id >= 51 && id <= 90),
    titleId: equippedIds.find(id => id >= 91 && id <= 130),
  }), [equippedIds]);

  const titleData = useMemo(() => {
    if (!titleId) return { title: "에코 시민", grade: "common" };
    let grade = "common";
    let baseId = 91;
    if (titleId >= 121) { grade = "legendary"; baseId = 121; }
    else if (titleId >= 111) { grade = "epic"; baseId = 111; }
    else if (titleId >= 101) { grade = "rare"; baseId = 101; }
    const list = TITLE_LIST[grade];
    const index = titleId - baseId;
    const result = (list && list[index]) ? list[index] : (list ? list[0] : { title: "에코 시민" });
    return { ...result, grade }; 
  }, [titleId]);

  const bgData = useMemo(() => {
    if (!bgId) return { grade: "common", preset: { g1: "#334155", g2: "#1e293b", ring: "#94a3b8" } };
    const grade = bgId > 80 ? "legendary" : bgId > 70 ? "epic" : bgId > 60 ? "rare" : "common";
    const offset = grade === "legendary" ? 81 : grade === "epic" ? 71 : grade === "rare" ? 61 : 51;
    const presetId = `${grade}-${(bgId - offset) + 1}`;
    const result = getTitleBgPresetById(presetId);
    return { grade, preset: result?.preset || { g1: "#334155", g2: "#1e293b", ring: "#94a3b8" } };
  }, [bgId]);

  const { grade: cardGrade, preset } = bgData;
  const styleVars = {
    "--g1": preset?.g1,
    "--g2": preset?.g2,
    "--ring": preset?.ring,
    "--ring-rgb": preset?.ring?.replace(/rgba?\(|\)/g, '') || "148, 163, 184"
  };

  return (
    <div 
      className={`${styles.profileContainer} ${size === "small" ? styles.small : styles.big}`} 
      style={styleVars}
    >
      {/* 배경 레이어: 칭호/배지 색상 변조 방지 */}
      <div className={`fx-background-layer rarity-${cardGrade} fx-bg-only`}>
        <div className="fx-glow" />
        <div className="fx-rays" />
        {cardGrade === "epic" && <div className="fx-epic-glow" />}
      </div>
      
      {/* 콘텐츠 레이어 */}
      <div className={styles.content}>
        <div className={styles.leftSide}>
          <div className={`${styles.circle} border-${cardGrade} ${cardGrade === 'legendary' ? 'fx-pulse' : ''}`}>
            {badgeId ? (
              <img 
                src={new URL(`../../assets/badges/${badgeId >= 31 ? "legendary" : badgeId >= 21 ? "epic" : badgeId >= 11 ? "rare" : "common"}/badge_${String(badgeId).padStart(2, "0")}.png`, import.meta.url).href} 
                className={styles.badgeImg} 
                alt="badge" 
              />
            ) : (
              <span className={styles.initial}>{userName?.[0]}</span>
            )}
          </div>
        </div>

        <div className={styles.rightSide}>
          <div className={`t-rarity-${titleData.grade}`}>
            <div className="fx-title-area">
              <span className="fx-main-title">
                {titleData.title}
              </span>
            </div>
          </div>
          <span className={styles.userName}>{userName}</span>
        </div>
      </div>
    </div>
  );
};

export default memo(Profile);