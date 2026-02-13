import api from "./axios";

export const getQuizByDifficulty = async (difficulty) => {
  const response = await api.get(`/api/quiz/${difficulty}`);
  return response.data;
};

export const saveQuizResult = async (userId, difficulty, score) => {
  const response = await api.post(`/api/quiz/result?userId=${userId}&difficulty=${difficulty}&score=${score}`);
  return response.data;
};
