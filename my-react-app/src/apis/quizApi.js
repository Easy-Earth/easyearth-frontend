import api from "./axios";

export const getQuizByDifficulty = async (difficulty, userId) => {
  const response = await api.get(`/api/quiz/${difficulty}?userId=${userId}`);
  return response.data;
};

export const saveQuizResult = async (userId, difficulty, score) => {
  const response = await api.post(`/api/quiz/result?userId=${userId}&difficulty=${difficulty}&score=${score}`);
  return response.data;
};

// 퀴즈 진행 현황 조회
export const getQuizStatus = async (userId) => {
  const response = await api.get(`/api/quiz/status?userId=${userId}`);
  return response.data;
};

export const saveQuizAttempt = async (userId, quizNo, isCorrect, point) => {
  const response = await api.post(`/api/quiz/attempt?userId=${userId}&quizNo=${quizNo}&isCorrect=${isCorrect}&point=${point}`);
  return response.data;
};
