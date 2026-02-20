import axios from "axios";

const BASE_URL = "/spring/static"; 

export const getEnvironmentEffectPersonal = async (memberId) => {
  try {
    const response = await axios.get(`${BASE_URL}/effects/personal/${memberId}`);
    return response.data;
  } catch (error) {
    console.error("error:", error);
    throw error;
  }
};

export const getEnvironmentEffectGlobal = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/effects/global`);
    return response.data;
  } catch (error) {
    console.error("error:", error);
    throw error;
  }
};