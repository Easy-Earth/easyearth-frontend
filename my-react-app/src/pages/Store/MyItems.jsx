import { useEffect, useState } from "react";
import { getMyItems, equipItem } from "../api/itemApi";

const MyItems = () => {
  const [myItems, setMyItems] = useState([]);
  const memberId = 1; // 테스트용

  useEffect(() => {
    const fetchMyItems = async () => {
      try {
        const data = await getMyItems(memberId);
        setMyItems(data);
      } catch (error) {
        console.error(error);
        alert("보유 아이템 불러오기 실패");
      }
    };
    fetchMyItems();
  }, []);

  const handleEquip = async (uiId) => {
    try {
      const res = await equipItem(uiId, memberId);
      alert(res);
    } catch (error) {
      console.error(error);
      alert("아이템 장착 실패");
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
    </div>
  );
};

export default MyItems;
