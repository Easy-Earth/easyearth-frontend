import { useEffect, useState } from "react";
import CustomModal from "../../components/common/CustomModal";
import { buyItem, getStoreItems } from "../api/itemApi";

const Store = () => {
  const [items, setItems] = useState([]);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getStoreItems();
        setItems(data);
      } catch (error) {
        console.error(error);
        setModalConfig({
          isOpen: true,
          type: 'alert',
          message: "상점 아이템 불러오기 실패",
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    };
    fetchItems();
  }, []);

  const handleBuy = async (item) => {
    try {
      const userItemsVO = {
        userId: 1, // 테스트용, 실제 로그인 유저 ID 사용
        itemId: item.itemId,
        price: item.price,
      };
      const res = await buyItem(userItemsVO);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: res,
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } catch (error) {
      console.error(error);
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: "아이템 구매 실패",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  return (
    <div>
      <h2>상점 아이템</h2>
      <ul>
        {items.map((item) => (
          <li key={item.itemId}>
            {item.name} - {item.price}P
            <button onClick={() => handleBuy(item)}>구매</button>
          </li>
        ))}
      </ul>

      {/* ✅ 커스텀 모달 컴포넌트 배치 */}
      <CustomModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default Store;