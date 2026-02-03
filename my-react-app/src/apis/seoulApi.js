// src/apis/seoulApi.js
import api from "./axios";

const seoulApi = {
  getThemesContents: async ({ themeIds, x, y, distance, keyword }) => {
    const response = await api.get("/api/seoul/themes/contents", {
      params: {
        themeIds,
        x,
        y,
        distance,
        keyword,
      },
      paramsSerializer: {
        indexes: null, 
      },
    });
    return response.data;
  },

  getDetail: async ({ themeId, contsId }) => {
    const response = await api.get("/api/seoul/detail", {
      params: {
        themeId,
        contsId
      }
    });
    return response.data;
  }
};

export default seoulApi;