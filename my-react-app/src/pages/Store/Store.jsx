import { useEffect, useState } from "react";
import { getStoreItems, buyItem, equipItem } from "../api/itemApi";

const Store = () => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const data = await getStoreItems();
        setItems(data);
      } catch (error) {
        console.error(error);
        alert("상점 아이템 불러오기 실패");
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
      alert(res);
    } catch (error) {
      console.error(error);
      alert("아이템 구매 실패");
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
    </div>
  );
};

export default Store;
