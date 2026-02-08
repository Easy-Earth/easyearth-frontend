import axios from "axios";

const BASE_URL = "/spring/items";

export const getStoreItems = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/select`);
    return response.data;
  } catch (error) {
    console.error("getStoreItems error:", error);
    throw error;
  }
};

// export const getMyItems = async (memberId) => {
//   try {
//     const response = await axios.get(`${BASE_URL}/myItems/${memberId}`);
//     return response.data;
//   } catch (error) {
//     console.error("getMyItems error:", error);
//     throw error;
//   }
// };

export const getItemDetail = async (itemId) => {
  try {
    const response = await axios.get(`${BASE_URL}/itemsDetail/${itemId}`);
    return response.data;
  } catch (error) {
    console.error("getItemDetail error:", error);
    throw error;
  }
};

export const getMyItemDetail = async (itemId, userId) => {
  try {
    const response = await axios.get(`${BASE_URL}/myItemsDetail/${itemId}`, {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error("getMyItemDetail error:", error);
    throw error;
  }
};

export const getItemCount = async (memberId) => {
  try {
    const response = await axios.get(`${BASE_URL}/itemCount/${memberId}`);
    return response.data;
  } catch (error) {
    console.error("getItemCount error:", error);
    throw error;
  }
};

export const getItemsByCategory = async (category) => {
  try {
    const response = await axios.get(`${BASE_URL}/categories/${category}`);
    return response.data;
  } catch (error) {
    console.error("getItemsByCategory error:", error);
    throw error;
  }
};

export const getItemsByRarity = async (rarity) => {
  try {
    const response = await axios.get(`${BASE_URL}/rarity/${rarity}`);
    return response.data;
  } catch (error) {
    console.error("getItemsByRarity error:", error);
    throw error;
  }
};

export const buyItem = async (userItemsVO) => {
  try {
    const response = await axios.post(`${BASE_URL}/buy`, userItemsVO);
    return response.data;
  } catch (error) {
    console.error("buyItem error:", error);
    throw error;
  }
};



export const randomPull = async (memberId) => {
  try {
    const response = await axios.get(`${BASE_URL}/random/${memberId}`);
    return response.data;
  } catch (error) {
    console.error("randomPull error:", error);
    throw error;
  }
};

/**
 * 아이템 장착/해제 API
 * @param {number} itemId - 아이템 식별자
 * @param {number} userId - 사용자 식별자
 * @param {string} category - 아이템 카테고리 (BADGE, TITLE, BACKGROUND)
 */


// 1. 인벤토리 목록 조회
export const getMyItems = async (userId) => {
  try {
    const token = localStorage.getItem("token");
    const response = await axios.get(`${BASE_URL}/myItems/${userId}`, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
    return response.data;
  } catch (error) {
    console.error("getMyItems error:", error);
    throw error;
  }
};

// 2. 아이템 장착/해제 (가짜 401 대응 로직 추가)
export const equipItem = async (itemId, userId, category) => {
  const token = localStorage.getItem("token");
  
  try {
    const response = await axios.patch(
      `${BASE_URL}/${itemId}/equip`,
      null,
      {
        params: { userId, category: category.toUpperCase() },
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "Content-Type": "application/json"
        }
      }
    );
    return response.data;
  } catch (error) {
    const errorData = error.response?.data;
    if (error.response?.status === 401 && typeof errorData === 'string' && errorData.includes("완료")) {
      console.warn("백엔드 에러 코드 오탐지: 401이지만 성공으로 처리함 (메시지: " + errorData + ")");
      return errorData; // 에러를 
    }

    console.error("equipItem error:", error.response || error);
    throw error; // 진짜 에러일 때만 MyPage로 넘김
  }
};

export const getEquippedItems = async (memberId) => {
  try {
    const response = await axios.get(`/spring/member/equipped/${memberId}`);
    return response.data; 
  } catch (error) {
    console.error("장착 아이템 조회 실패:", error);
    return [];
  }
};