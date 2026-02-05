import React from "react";
import Button from "../common/Button"; 
import modalStyles from "./ItemModal.module.css"; 

const InventoryModal = ({ item, onClose, onEquipToggle, imageSrc }) => {
  if (!item) return null;

  // 🔍 백엔드 MyBatis JOIN 결과(UserItemList)에 맞춘 데이터 매핑
  // DB 컬럼명: NAME -> item.name, DESCRIPTION -> item.description
  const itemName = item.name || "이름 없음"; 
  const itemDesc = item.description || "상세 정보가 없습니다.";
  
  // DB 컬럼명: CATEGORY -> item.category
  const itemCategory = (item.category || "BADGE").toUpperCase();
  
  // DB 컬럼명: RARITY -> item.rarity
  const itemRarity = (item.rarity || "COMMON").toUpperCase();
  
  // ✅ 장착 여부: IS_EQUIPPED -> item.isEquipped
  const isEquipped = item.isEquipped === 'Y';
  const isLegendary = itemRarity === "LEGENDARY";

  const rarityColors = {
    COMMON: "#94a3b8", 
    RARE: "#3b82f6", 
    EPIC: "#8b5cf6", 
    LEGENDARY: "#f59e0b",
  };

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div 
        className={`${modalStyles.modalContent} ${isLegendary ? modalStyles.legendaryContent : ""}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className={modalStyles.closeBtn} onClick={onClose}>&times;</button>
        
        <div className={modalStyles.modalBody}>
          {/* 등급에 따른 배경 클래스 적용 */}
          <div className={`${modalStyles.modalImageSection} ${modalStyles[itemRarity.toLowerCase()]}`}>
            <img 
              src={imageSrc} 
              alt={itemName} 
              className={isLegendary ? modalStyles.pulseImage : ""} 
            />
          </div>
          
          <div className={modalStyles.modalInfoSection}>
            <span className={modalStyles.modalRarity} style={{ color: rarityColors[itemRarity] }}>
              {itemRarity}
            </span>
            <h2 className={modalStyles.modalItemName}>{itemName}</h2>
            
            <span className={modalStyles.modalCategoryBadge}>
              {itemCategory.replace('_', ' ')}
            </span>

            <p className={modalStyles.modalItemDesc}>{itemDesc}</p>
            
            <div className={modalStyles.modalItemFooter}>
              <div className={modalStyles.equipSection}>
                <p className={modalStyles.statusText}>
                  {isEquipped ? "✨ 현재 착용 중인 아이템입니다." : "📦 인벤토리에 보관 중입니다."}
                </p>
                <Button 
                  color={isEquipped ? "#1e293b" : (isLegendary ? "#f59e0b" : "#14b8a6")} 
                  onClick={() => onEquipToggle(item)} // 부모의 handleEquipToggle 호출
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