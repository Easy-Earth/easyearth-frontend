import "../../styles/itemEffects.css";
import { TITLE_BG_PRESETS } from "../../utils/profileBackgrounds";

const ItemCssPreview = ({ item }) => {
  const category = (item.itemCategory || item.category || "").toUpperCase();
  const rarity = (item.rarity || item.RARITY || "common").toLowerCase();
  
  const rarityList = TITLE_BG_PRESETS[rarity] || TITLE_BG_PRESETS.common;
  const itemIdNum = parseInt(item.itemId || item.ITEM_ID || 1);
  const preset = rarityList[(itemIdNum - 1) % rarityList.length];

  // 1. 등급별 칭호 배경색 정의 (텍스트 가독성을 위해 어두운 톤 사용)
  const getTitleBg = (rarity) => {
    switch (rarity) {
      case 'common': return '#74d599';    // 녹색 (어두운 톤)
      case 'rare': return '#728de8';      // 하늘색/파랑 (어두운 톤)
      case 'epic': return '#a869db';      // 보라색
      case 'legendary': return '#e9c295'; // 노란색/금색 (어두운 톤)
      default: return '#111827';         // 기본 블랙계열
    }
  };

  const styleVars = {
    "--g1": preset.g1, 
    "--g2": preset.g2, 
    "--ring": preset.ring,
    // 칭호일 때는 위에서 정의한 배경색을 사용
    backgroundColor: category === "TITLE" ? getTitleBg(rarity) : undefined,
  };

  return (
    <div 
      className={`fx-badge-card rarity-${rarity} ${
        category === 'TITLE' ? 'fx-title-only-mode' : 'fx-bg-black fx-bg-only'
      }`} 
      style={styleVars}
    >
      {/* BACKGROUND일 때만 광원 렌더링 */}
      {category === "BACKGROUND" && (
        <>
          <div className={`fx-glow ${rarity === 'epic' ? 'fx-epic-glow' : ''}`} />
          {(rarity === "legendary" || rarity === "epic") && (
            <>
              <div className="fx-rays" />
              <div className="fx-ring" />
            </>
          )}
        </>
      )}

      {/* TITLE일 때: 가독성을 위해 그림자 보강 */}
      {category === "TITLE" && (
        <div className="fx-title-area">
          <span 
            className="fx-main-title" 
            style={{ 
              color: '#ffffff', 
              textShadow: '0 2px 4px rgba(0,0,0,0.5)', // 글자 테두리 그림자 추가
              fontSize: '1.2rem' 
            }}
          >
            {item.name || item.itemName}
          </span>
        </div>
      )}
    </div>
  );
};

export default ItemCssPreview;