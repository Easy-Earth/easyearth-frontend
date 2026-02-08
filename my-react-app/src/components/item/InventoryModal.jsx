import ItemCssPreview from "../../components/item/ItemCssPreview"; // 경로에 맞게 확인해주세요
import "../../styles/itemEffects.css";
import Button from "../common/Button";
import modalStyles from "./ItemModal.module.css";

const InventoryModal = ({ item, onClose, onEquipToggle, imageSrc }) => {
  if (!item) return null;

  const itemName = item.name || "이름 없음"; 
  const itemDesc = item.description || "상세 정보가 없습니다.";
  const itemCategory = (item.category || "BADGE").toUpperCase();
  const itemRarity = (item.rarity || "COMMON").toUpperCase();
  const isEquipped = item.isEquipped === 'Y';
  const isLegendary = itemRarity === "LEGENDARY";

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div className={`${modalStyles.modalContent} ${isLegendary ? 'fx-legendary-border' : ''}`} onClick={(e) => e.stopPropagation()}>
        <button className={modalStyles.closeBtn} onClick={onClose}>&times;</button>
        <div className={modalStyles.modalBody}>
          {/* 상단 이미지/효과 섹션 */}
          <div className={`${modalStyles.modalImageSection} bg-${itemRarity.toLowerCase()}`}>
            {itemCategory === "BADGE" ? (
              <img src={imageSrc} alt={itemName} className={isLegendary ? "fx-pulse" : ""} />
            ) : (
              <div style={{ width: '100%', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {/* 칭호/배경은 CSS 프리뷰를 출력 (배경 광원 제거된 버전) */}
                <ItemCssPreview item={item} />
              </div>
            )}
          </div>

          <div className={modalStyles.modalInfoSection}>
            <span className={modalStyles.modalRarity} style={{ color: `var(--color-${itemRarity.toLowerCase()})` }}>
              {itemRarity}
            </span>
            <h2 className={modalStyles.modalItemName}>{itemName}</h2>
            <span className={modalStyles.modalCategoryBadge}>{itemCategory.replace('_', ' ')}</span>
            <p className={modalStyles.modalItemDesc}>{itemDesc}</p>
            
            <div className={modalStyles.modalItemFooter}>
              <div className={modalStyles.equipSection}>
                <p className={modalStyles.statusText}>{isEquipped ? "✨ 현재 착용 중" : "📦 보관 중"}</p>
                <Button 
                  color={isEquipped ? "#1e293b" : (isLegendary ? "#f59e0b" : "#14b8a6")} 
                  onClick={() => onEquipToggle(item)} 
                  width="100%" 
                  height="50px"
                >
                  {isEquipped ? "장착 해제하기" : "아이템 장착하기"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;