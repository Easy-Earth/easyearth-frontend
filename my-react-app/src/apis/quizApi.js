import api from "./axios";

export const getQuizByDifficulty = async (difficulty) => {
  const response = await api.get(`/api/quiz/${difficulty}`);
  return response.data;
};
