import { useEffect, useState } from "react";
import CustomModal from "../../components/common/CustomModal";
import { equipItem, getMyItems } from "../api/itemApi";

const MyItems = () => {
  const [myItems, setMyItems] = useState([]);
  const memberId = 1; // 테스트용

  // 커스텀 모달 상태 관리
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const data = await getMyItems(memberId);
        setMyItems(data);
      } catch (error) {
        console.error(error);
        setModalConfig({
          isOpen: true,
          type: 'alert',
          message: "보유 아이템 불러오기 실패",
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    };
    fetchMyItems();
  }, []);

  const handleEquip = async (uiId) => {
    try {
      const res = await equipItem(uiId, memberId);
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
        message: "아이템 장착 실패",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    }
  };

  return (
    <div>
      <h2>내 아이템</h2>
      <ul>
        {myItems.map((item) => (
          <li key={item.uiId}>
            {item.name} - {item.rarity}
            <button onClick={() => handleEquip(item.uiId)}>장착/해제</button>
          </li>
        ))}
      </ul>

      {/* 커스텀 모달 추가 */}
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

export default MyItems;