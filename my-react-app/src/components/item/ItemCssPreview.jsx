import "../../styles/itemEffects.css";
import { TITLE_BG_PRESETS } from "../../utils/profileBackgrounds";

const ItemCssPreview = ({ item }) => {
  const category = (item.itemCategory || item.category || "").toUpperCase();
  const rarity = (item.rarity || item.RARITY || "common").toLowerCase();
  
  // 데이터 프리셋 가져오기
  const rarityList = TITLE_BG_PRESETS[rarity] || TITLE_BG_PRESETS.common;
  const itemIdNum = parseInt(item.itemId || item.ITEM_ID || 1);
  const preset = rarityList[(itemIdNum - 1) % rarityList.length];

  const hexToRgb = (hex) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r}, ${g}, ${b}`;
  };

  const styleVars = {
    "--g1": preset.g1, 
    "--g2": preset.g2, 
    "--ring": preset.ring,
    "--ring-rgb": hexToRgb(preset.ring),
  };

  return (
    <div 
      className={`fx-badge-card rarity-${rarity} ${category === 'TITLE' ? '' : 'fx-bg-black fx-bg-only'}`} 
      style={styleVars}
    >
      {/* 배경 광조 레이어 (에픽은 fx-epic-glow 적용) */}
      <div className={`fx-glow ${rarity === 'epic' ? 'fx-epic-glow' : ''}`} />
      
      {category === "BACKGROUND" && (
        <>
          {/* 전설(legendary)과 에픽(epic) 등급에서만 회전 효과 요소 렌더링 */}
          {(rarity === "legendary" || rarity === "epic") && (
            <>
              <div className="fx-rays" />
              <div className="fx-ring" />
            </>
          )}
        </>
      )}

      {category === "TITLE" && (
        <div className="fx-title-area">
          <span className="fx-main-title">{item.name || item.itemName}</span>
        </div>
      )}
    </div>
  );
};

export default ItemCssPreview;