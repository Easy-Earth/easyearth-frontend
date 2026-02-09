import ItemCssPreview from "../../components/item/ItemCssPreview"; // 공통 CSS 효과 컴포넌트
import "../../styles/itemEffects.css"; // 공통 애니메이션 및 등급 색상
import Button from "../common/Button";
import modalStyles from "./ItemModal.module.css";

/**
 * ItemModal 컴포넌트
 * @param {Object} item: 선택된 아이템 정보
 * @param {Function} onClose: 모달 닫기 함수
 * @param {Function} onBuy: 구매 처리 함수
 * @param {Boolean} isOwned: 보유 여부
 * @param {String} imageSrc: ShopPage에서 계산되어 넘어온 이미지 경로
 */
const ItemModal = ({ item, onClose, onBuy, isOwned, imageSrc }) => {
  if (!item) return null;

  // 🔍 필드 매핑 (기존 로직 100% 유지)
  const itemName = item.name || item.itemName || "이름 없음"; 
  const itemDesc = item.itemDescription || item.description || "상세 설명이 없습니다.";
  const itemPrice = item.price || item.PRICE || 0;
  const itemRarity = (item.rarity || item.RARITY || "COMMON").toUpperCase();
  const itemCategory = (item.itemCategory || item.category || "BADGE").toUpperCase();
  
  // ✅ 판매 여부 및 등급 확인 (기존 로직 100% 유지)
  const isOnSale = (item.isOnSale || item.IS_ON_SALE) === 'Y';
  const isLegendary = itemRarity === "LEGENDARY";

  // 등급별 색상 (CSS 변수와 매칭)
  const rarityColors = {
    COMMON: "#94a3b8", 
    RARE: "#3b82f6", 
    EPIC: "#8b5cf6", 
    LEGENDARY: "#f59e0b",
  };

  return (
    <div className={modalStyles.modalOverlay} onClick={onClose}>
      <div 
        /* 전설 등급일 때 fx-legendary-border 공통 클래스 추가 */
        className={`
          ${modalStyles.modalContent} 
          ${isLegendary ? modalStyles.legendaryContent : ""} 
          ${isLegendary ? "fx-legendary-border" : ""}
        `} 
        onClick={(e) => e.stopPropagation()}
      >
        <button className={modalStyles.closeBtn} onClick={onClose}>&times;</button>
        
        <div className={modalStyles.modalBody}>
          {/* 등급별 배경색 섹션 - itemEffects.css의 bg-등급 클래스 연동 */}
          <div className={`
            ${modalStyles.modalImageSection} 
            ${modalStyles[itemRarity.toLowerCase()]} 
            bg-${itemRarity.toLowerCase()}
          `}>
            {/* 뱃지는 이미지를, 칭호/배경은 CSS 효과를 보여줌 */}
            {itemCategory === "BADGE" ? (
              <img 
                src={imageSrc} 
                alt={itemName} 
                className={isLegendary ? "fx-pulse" : ""} 
              />
            ) : (
              <div style={{ width: '100%', height: '180px' }}>
                <ItemCssPreview item={item} />
              </div>
            )}
          </div>
          
          <div className={modalStyles.modalInfoSection}>
            <span className={modalStyles.modalRarity} style={{ color: rarityColors[itemRarity] }}>
              {itemRarity}
            </span>
            <h2 className={modalStyles.modalItemName}>{itemName}</h2>
            
            <span className={modalStyles.modalCategoryBadge}>
              {itemCategory.replace('_', ' ')}
            </span>

            <div className={modalStyles.modalDescriptionBox}>
              <p className={modalStyles.modalItemDesc}>{itemDesc}</p>
            </div>
            
            <div className={modalStyles.modalItemFooter}>
              {isOwned ? (
                /* ✅ 이미 보유 중인 경우 - 기존 로직 그대로 */
                <div className={modalStyles.ownedSection}>
                  <p className={modalStyles.ownedText} style={{ textAlign: 'center', marginBottom: '15px', color: '#94a3b8' }}>
                    이미 보유하고 있는 아이템입니다.
                  </p>
                  <Button color="#64748b" onClick={onClose} width="100%" height="50px">
                    닫기
                  </Button>
                </div> 
              ) : isOnSale ? (
                /* 🛒 판매 중이고 보유하지 않은 경우 - 기존 로직 그대로 */
                <>
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
                </>
              ) : (
                /* 🔒 비매품인 경우 - 기존 로직 그대로 */
                <div className={modalStyles.notForSaleSection}>
                  <p className={modalStyles.notForSaleText} style={{ textAlign: 'center', marginBottom: '15px', color: '#ef4444' }}>
                    이 아이템은 상점에서 직접 구매할 수 없습니다.
                  </p>
                  <Button 
                    color="#64748b" 
                    onClick={onClose}
                    width="100%"
                    height="50px"
                  >
                    확인
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ItemModal;