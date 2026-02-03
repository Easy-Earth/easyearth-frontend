import api from "./axios";

export const routeApi = {
  // ORS: driving-car / foot-walking / cycling-regular
  getOrsRoute: async ({
    startX,
    startY,
    goalX,
    goalY,
    mode = "driving-car",
  }) => {
    const res = await api.get("/api/route/ors", {
      params: { startX, startY, goalX, goalY, mode },
    });
    return res.data;
  },

  // 대중교통(ODsay)
  getTransitRoute: async ({ startX, startY, goalX, goalY }) => {
    const res = await api.get("/api/route/transit", {
      params: { startX, startY, goalX, goalY },
    });
    return res.data;
  },
};

export default routeApi;
