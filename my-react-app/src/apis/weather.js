import axios from "axios";

export const weatherApi = {
  getForecastList: async () => {
    try {
      const [weatherRes, dustRes] = await Promise.all([
        axios.get("http://localhost:8080/spring/weather/forecast"),
        axios.get("http://localhost:8080/spring/weather/dust")
      ]);

      const now = new Date();
      const currentFullTime = parseInt(
        now.getFullYear() + 
        (now.getMonth() + 1).toString().padStart(2, '0') + 
        now.getDate().toString().padStart(2, '0') + 
        now.getHours().toString().padStart(2, '0')
      );

      const dustMap = new Map();
      dustRes.data.forEach(d => {
        const timeKey = d.tm.substring(0, 10); 
        if (!dustMap.has(timeKey)) dustMap.set(timeKey, d.pm10);
      });

      const weatherList = [];
      const tempGroup = {};

      weatherRes.data.forEach(item => {
        const itemFullTime = parseInt(item.fcstDate + item.fcstTime.substring(0, 2));
        
        if (Math.abs(itemFullTime - currentFullTime) <= 3) {
          const key = `${item.fcstDate}_${item.fcstTime}`;
          if (!tempGroup[key]) {
            tempGroup[key] = { 
              date: item.fcstDate, 
              time: item.fcstTime,
              displayTime: `${item.fcstTime.substring(0, 2)}:00`,
              pm10: dustMap.get(item.fcstDate + item.fcstTime.substring(0, 2)) || null
            };
          }
          if (item.category === "TMP") tempGroup[key].tmp = item.fcstValue;
          if (item.category === "SKY") tempGroup[key].sky = item.fcstValue;
          if (item.category === "PTY") tempGroup[key].pty = item.fcstValue;
          if (item.category === "REH") tempGroup[key].reh = item.fcstValue;
          if (item.category === "WSD") tempGroup[key].wsd = item.fcstValue;
        }
      });

      return Object.values(tempGroup).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    } catch (error) {
      return [];
    }
  },

  getForecast: async () => {},
  
  getSecretaryMessage: async () => {
    try {
      const response = await axios.post("http://localhost:8080/spring/gemini/secretary");
      return response.data.message;
    } catch (error) {
      return "지구를 위한 작은 실천, 오늘부터 시작해볼까요? 🌱";
    }
  }
};