import axios from "axios";

const BASE_URL = "spring/items";

export const getStoreItems = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/select`);
    return response.data;
  } catch (error) {
    console.error("getStoreItems error:", error);
    throw error;
  }
};

export const getMyItems = async (memberId) => {
  try {
    const response = await axios.get(`${BASE_URL}/myItems/${memberId}`);
    return response.data;
  } catch (error) {
    console.error("getMyItems error:", error);
    throw error;
  }
};

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

export const equipItem = async (uiId, userId) => {
  try {
    const response = await axios.patch(`${BASE_URL}/${uiId}/equip`, null, {
      params: { userId },
    });
    return response.data;
  } catch (error) {
    console.error("equipItem error:", error);
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
