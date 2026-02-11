import axios from "axios";
import { memo, useEffect, useMemo, useState } from "react";
import "../../styles/itemEffects.css";
import { TITLE_BG_PRESETS } from "../../utils/profileBackgrounds"; // 프리셋 원본 통째로 가져오기
import { TITLE_LIST } from "../../utils/profileTitles";
import styles from "./Profile.module.css";

const Profile = ({ size = "big", memberId, userName = "사용자", onClick }) => {
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

  // 1. 장착된 아이템 분류 (범위 기준)
  const { badgeId, bgId, titleId } = useMemo(() => ({
    badgeId: equippedIds.find(id => id >= 1 && id <= 50),
    bgId: equippedIds.find(id => id >= 51 && id <= 90),
    titleId: equippedIds.find(id => id >= 91 && id <= 130),
  }), [equippedIds]);

  // 2. 배경(Background) 데이터 로직 - 상점(ItemCssPreview)과 로직 통일
  const bgData = useMemo(() => {
    // 장착된 배경이 없을 때 기본값
    if (!bgId) return { grade: "common", preset: { g1: "#334155", g2: "#1e293b", ring: "#94a3b8" } };

    // 등급 판정
    let grade = "common";
    if (bgId >= 81) grade = "legendary";
    else if (bgId >= 71) grade = "epic";
    else if (bgId >= 61) grade = "rare";

    // ✅ 핵심: 상점과 동일한 리스트 인덱스 추출 (나머지 연산)
    const rarityList = TITLE_BG_PRESETS[grade] || TITLE_BG_PRESETS.common;
    const index = (bgId - 1) % rarityList.length; 
    const preset = rarityList[index];

    return { grade, preset };
  }, [bgId]);

  // 3. 칭호(Title) 데이터 로직
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

  // 4. CSS 변환 헬퍼 (HEX -> RGB)
  const hexToRgb = (hex) => {
    if (!hex) return "148, 163, 184";
    // 이미 rgba 형태인 경우 숫자만 추출
    if (hex.startsWith('rgba')) {
      return hex.replace(/rgba?\(|\)/g, '').split(',').slice(0, 3).join(',');
    }
    // HEX 형태 (#ffffff) 변환
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const { grade: cardGrade, preset } = bgData;

  const styleVars = {
    "--g1": preset.g1,
    "--g2": preset.g2,
    "--ring": preset.ring,
    "--ring-rgb": hexToRgb(preset.ring),
    cursor: onClick ? "pointer" : "default"
  };

  return (
    <div 
      className={`${styles.profileContainer} ${size === "small" ? styles.small : styles.big}`} 
      style={styleVars}
      onClick={() => onClick && onClick(memberId)}
    >
      {/* 배경 레이어 (itemEffects.css 활용) */}
      <div className={`fx-background-layer rarity-${cardGrade} fx-bg-only`}>
        <div className="fx-glow" />
        <div className="fx-rays" />
        {cardGrade === "epic" && <div className="fx-epic-glow" />}
      </div>
      
      {/* 콘텐츠 레이어 */}
      <div className={styles.content}>
        <div className={styles.leftSide}>
          {/* 배지 테두리 등급 적용 */}
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
          {/* 칭호 등급 클래스 적용 (t-rarity-...) */}
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