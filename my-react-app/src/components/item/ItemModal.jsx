import React from "react";
import Button from "../common/Button"; 
import modalStyles from "./ItemModal.module.css"; 

const ItemModal = ({ item, onClose, onBuy }) => {
  if (!item) return null;

  // 🔍 해결된 필드 매핑 적용
  const itemName = item.name || "이름 없음"; 
  const itemDesc = item.itemDescription || item.description || "상세 설명이 없습니다.";
  const itemPrice = item.price || 0;
  const itemRarity = item.rarity || "COMMON";
  const itemCategory = item.itemCategory || item.category || "GENERAL";
  const itemImage = item.itemImage || "/default-item.png";

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
          {/* 등급별 배경색 섹션 (common, rare, epic, legendary 클래스 사용) */}
          <div className={`${modalStyles.modalImageSection} ${modalStyles[itemRarity.toLowerCase()]}`}>
            <img src={itemImage} alt={itemName} className={isLegendary ? modalStyles.pulseImage : ""} />
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
              <div className={modalStyles.modalPriceContainer}>
                <span className={modalStyles.modalPriceLabel}>결제 예정 금액</span>
                <span className={modalStyles.modalPriceValue}>
                  <i className={modalStyles.coinIcon}>P</i> {itemPrice.toLocaleString()}
                </span>
              </div>
              
              <Button 
                color={isLegendary ? "#f59e0b" : "#14b8a6"} 
                onClick={() => onBuy(item)}
                width="100%"
                height="50px"
              >
                아이템 구매하기
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;