import { useCallback, useEffect, useMemo, useState } from "react";
import authApi from "../../apis/authApi";
import * as itemApi from "../../apis/itemApi";
import Button from "../../components/common/Button";
import CustomModal from "../../components/common/CustomModal";
import ItemCssPreview from "../../components/item/ItemCssPreview";
import ItemModal from "../../components/item/ItemModal";
import { useAuth } from "../../context/AuthContext";
import "../../styles/itemEffects.css";
import styles from "./ShopPage.module.css";

const defaultImg = "https://via.placeholder.com/150?text=No+Image";

const ShopPage = () => {
  const { user } = useAuth();
  // user 객체 내의 고유 식별자 추출 (VO 구조에 따라 memberNo 또는 memberId)
  const memberId = user?.memberNo || user?.memberId || user?.id;

  const [allItems, setAllItems] = useState([]);      
  const [myItems, setMyItems] = useState([]);        
  const [loading, setLoading] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const [pullResult, setPullResult] = useState(null);
  const [isDuplicate, setIsDuplicate] = useState(false); 
  const [selectedItem, setSelectedItem] = useState(null);
  
  // 💰 사용자 포인트 상태
  const [userPoint, setUserPoint] = useState(0);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false, type: 'alert', message: '', onConfirm: () => {}
  });

  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [rarityFilter, setRarityFilter] = useState("ALL");

  const categoryMenu = [
    { label: "전체", value: "ALL" },
    { label: "뱃지", value: "BADGE" },
    { label: "칭호", value: "TITLE" },
    { label: "배경", value: "BACKGROUND" },
  ];

  const rarityMenu = [
    { label: "전체", value: "ALL" },
    { label: "COMMON", value: "COMMON" },
    { label: "RARE", value: "RARE" },
    { label: "EPIC", value: "EPIC" },
    { label: "LEGENDARY", value: "LEGENDARY" },
  ];

  // 💰 포인트 조회 함수 (authApi 사용 및 MemberWalletVO 필드명 반영)
  const fetchUserPoint = useCallback(async () => {
    if (!memberId) return;
    try {
      // MemberController의 @GetMapping("/point/{memberId}") 호출
      const walletData = await authApi.getMemberPoint(memberId); 
      // MemberWalletVO의 실제 필드명인 nowPoint를 사용하여 상태 업데이트
      setUserPoint(walletData.nowPoint ?? 0);
    } catch (error) {
      console.error("포인트 조회 실패:", error);
    }
  }, [memberId]);

  const getItemImage = (item) => {
    if (!item || typeof item === 'string') return defaultImg;
    const category = (item.itemCategory || item.category || "BADGE").toUpperCase();
    if (category !== "BADGE") return null;
    const rarity = (item.rarity || item.RARITY || "common").toLowerCase();
    const itemId = item.itemId || item.ITEM_ID || 0;
    const formattedId = String(itemId).padStart(2, '0');
    const fileName = `badge_${formattedId}.png`;
    try {
      return new URL(`../../assets/badges/${rarity}/${fileName}`, import.meta.url).href;
    } catch (err) {
      return defaultImg;
    }
  };

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [storeData, myDataResponse] = await Promise.all([
        itemApi.getStoreItems(),
        memberId ? itemApi.getMyItems(memberId) : Promise.resolve([])
      ]);
      setAllItems(Array.isArray(storeData) ? storeData : []);
      const myData = Array.isArray(myDataResponse) ? myDataResponse : (myDataResponse?.data || []);
      setMyItems(myData.map(item => String(item.itemId || item.ITEM_ID || "")));
      
      // 데이터 로드 시 포인트도 함께 조회
      if (memberId) fetchUserPoint();
    } catch (error) {
      console.error("데이터 로드 실패:", error);
    } finally {
      setLoading(false);
    }
  }, [memberId, fetchUserPoint]);

  useEffect(() => { fetchInitialData(); }, [fetchInitialData]);

  const filteredItems = useMemo(() => {
    return allItems.filter(item => {
      const itemCat = item.itemCategory || item.category || "";
      const itemRar = (item.rarity || item.RARITY || "").toUpperCase();
      const matchCategory = categoryFilter === "ALL" || itemCat === categoryFilter;
      const matchRarity = rarityFilter === "ALL" || itemRar === rarityFilter;
      return matchCategory && matchRarity;
    });
  }, [allItems, categoryFilter, rarityFilter]);

  const handleBuy = (item) => {
    const id = item.itemId || item.ITEM_ID; 
    if (!memberId) {
      setModalConfig({
        isOpen: true, type: 'alert', message: '로그인이 필요한 서비스입니다.',
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message: `[${item.name || item.itemName}] 구매하시겠습니까?`,
      onConfirm: async () => {
        try {
          const purchaseData = {
            userId: memberId,
            itemId: id,
            price: item.price || item.PRICE,
            category: item.category || item.CATEGORY
          };

          await itemApi.buyItem(purchaseData);

          setMyItems(prev => [...prev, String(id)]);
          setSelectedItem(null);
          
          // 💰 구매 성공 후 포인트 갱신
          fetchUserPoint();

          setModalConfig({
            isOpen: true, 
            type: 'alert', 
            message: '🎉 구매 완료되었습니다!',
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        } catch (error) {
          setModalConfig({
            isOpen: true, 
            type: 'alert', 
            message: error.response?.data || "구매 중 오류가 발생했습니다.",
            onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
          });
        }
      }
    });
  };

  const handleRandomPull = () => {
    if (!memberId) {
      setModalConfig({ 
        isOpen: true, 
        type: 'alert', 
        message: '로그인이 필요합니다.',
        // 확인 버튼을 눌렀을 때 모달을 닫도록 추가
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false })) 
      });
      return;
    }
    setModalConfig({
      isOpen: true,
      type: 'confirm',
      message: '1,000P를 사용하여 랜덤 뽑기를 진행하시겠습니까?',
      onConfirm: async () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        setIsPulling(true);
        setPullResult(null);
        setIsDuplicate(false);
        try {
          const result = await itemApi.randomPull(memberId);
          
          setTimeout(() => {
            if (typeof result === 'string') {
              setIsDuplicate(true);
              setPullResult({ itemName: "이미 보유 중인 아이템", rarity: "common" });
            } else {
              setPullResult(result);
              const newItemId = String(result.itemId || result.ITEM_ID || "");
              if (myItems.includes(newItemId)) {
                setIsDuplicate(true);
              } else {
                setMyItems(prev => [...prev, newItemId]);
              }
            }
            // 💰 뽑기 연출 종료 시 포인트 갱신
            fetchUserPoint();
          }, 1500);
        } catch (error) {
          setIsPulling(false);
          setModalConfig({ isOpen: true, type: 'alert', message: "포인트 부족 또는 오류 발생" });
        }
      }
    });
  };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <h1 className={styles.pageTitle}>🌱 에코 포인트 상점</h1>
          {/* 💰 실시간 포인트 표시 영역 */}
          {memberId && (
            <div className={styles.userPointDisplay}>
              <span className={styles.pointLabel}>내 보유 포인트</span>
              <span className={styles.pointValue}>
                <i className={styles.coinIcon}>P</i> {userPoint.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        <div className={styles.gachaBanner}>
          <div className={styles.gachaText}>
            <h3>행운의 랜덤 뽑기</h3>
            <p>1,000P로 전설 등급 아이템에 도전하세요!</p>
          </div>
          <div className={styles.gachaBtnWrapper}>
            <Button color="#fbbf24" onClick={handleRandomPull} width="160px" height="50px">
              <span className={styles.btnText}>뽑기 시작</span>
            </Button>
          </div>
        </div>

        <div className={styles.filterWrapper}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>유형별</span>
            <div className={styles.categoryBar}>
              {categoryMenu.map((m) => (
                <button
                  key={m.value}
                  className={`${styles.categoryTab} ${categoryFilter === m.value ? styles.active : ""}`}
                  onClick={() => setCategoryFilter(m.value)}
                >{m.label}</button>
              ))}
            </div>
          </div>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>등급별</span>
            <div className={styles.categoryBar}>
              {rarityMenu.map((m) => (
                <button
                  key={m.value}
                  className={`${styles.categoryTab} ${rarityFilter === m.value ? styles.active : ""}`}
                  onClick={() => setRarityFilter(m.value)}
                >{m.label}</button>
              ))}
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div className={styles.statusMsg}>아이템 로드 중...</div>
      ) : (
        <div className={styles.itemGrid}>
          {filteredItems.map((item) => {
            const itemId = String(item.itemId || item.ITEM_ID || "");
            const isOwned = myItems.includes(itemId);
            const rarityLower = (item.rarity || item.RARITY || 'common').toLowerCase();

            return (
              <div 
                key={itemId} 
                className={`${styles.itemCard} ${styles[`card_${rarityLower}`]}`}
                onClick={() => setSelectedItem(item)}
                style={{ position: 'relative', overflow: 'hidden' }}
              >
                <div className={`fx-background-layer rarity-${rarityLower} fx-bg-only`} style={{ filter: 'blur(20px)', transform: 'scale(1.2)', opacity: 0.6 }}>
                  <div className="fx-glow" />
                </div>

                <span className={`${styles.rarityTag} bg-${rarityLower}`} style={{ zIndex: 2 }}>{rarityLower.toUpperCase()}</span>
                <div className={styles.imageArea} style={{ position: 'relative', zIndex: 1, background: 'transparent' }}>
                  {(item.itemCategory || item.category || "BADGE").toUpperCase() === "BADGE" ? (
                    <img src={getItemImage(item)} alt={item.name} className={`${styles.badgeImg} ${rarityLower === 'legendary' ? 'fx-pulse' : ''}`} />
                  ) : (
                    <ItemCssPreview item={item} />
                  )}
                </div>
                <div className={styles.infoArea} style={{ position: 'relative', zIndex: 1 }}>
                  <h3 className={styles.itemName}>{item.name || item.itemName}</h3>
                  <div className={styles.cardFooter}>
                    <span className={styles.priceTag}>{rarityLower === 'legendary' ? '비매품' : `${(item.price || item.PRICE).toLocaleString()} P`}</span>
                    {isOwned ? <span className={styles.ownedLabel}>보유 중</span> : <Button color="#14b8a6" onClick={(e) => { e.stopPropagation(); handleBuy(item); }} width="70px" height="34px">구매</Button>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {isPulling && (
        <div className={styles.pullOverlay}>
          <div className={`${styles.pullCard} ${pullResult ? styles.isFlipped : ""}`}>
            <div className={styles.cardFront}>?</div>
            <div className={`${styles.cardBack} ${pullResult ? styles[`res_${(pullResult.rarity || pullResult.RARITY || 'common').toLowerCase()}`] : ''}`}>
              {pullResult && (
                <>
                  <span className={`${styles.rarityTag} bg-${(pullResult.rarity || pullResult.RARITY || 'common').toLowerCase()}`}>{ (pullResult.rarity || pullResult.RARITY || 'common').toUpperCase() }</span>
                  {!isDuplicate ? (
                    <div className={styles.resultVisual}>
                      {(pullResult.itemCategory || pullResult.category) === "BADGE" ? (
                         <img src={getItemImage(pullResult)} alt="res" className={`${styles.badgeImg}`} />
                      ) : (
                         <ItemCssPreview item={pullResult} />
                      )}
                    </div>
                  ) : (
                    <div className={styles.resultVisual} style={{ flexDirection: 'column', gap: '10px' }}>
                      <span style={{ fontSize: '50px' }}>♻️</span>
                      <p style={{ fontWeight: '800', color: '#64748b', margin: 0 }}>중복 아이템 확인</p>
                    </div>
                  )}

                  <div className={styles.resultInfo}>
                    <h3 className={styles.resultTitle}>{pullResult.itemName || pullResult.name}</h3>
                    {isDuplicate && (
                      <div style={{ marginTop: '10px' }}>
                        <p className={styles.duplicateMsg} style={{ fontSize: '18px', color: '#f59e0b' }}>이미 가지고 있는 아이템이에요!</p>
                        <p style={{ fontSize: '14px', color: '#94a3b8', fontWeight: '600' }}>아쉽지만 500포인트로 환급해 드렸습니다.</p>
                      </div>
                    )}
                  </div>
                  <Button color="#14b8a6" onClick={() => setIsPulling(false)} width="100px" height="40px">확인</Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <ItemModal item={selectedItem} onClose={() => setSelectedItem(null)} onBuy={handleBuy} isOwned={myItems.includes(String(selectedItem?.itemId || selectedItem?.ITEM_ID || ""))} imageSrc={getItemImage(selectedItem)} />
      <CustomModal isOpen={modalConfig.isOpen} type={modalConfig.type} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} />
    </div>
  );
};

export default ShopPage;