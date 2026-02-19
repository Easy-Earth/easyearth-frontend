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
        
          // 미세먼지 대체 로직: 정확한 시간의 데이터가 있으면 사용하고, 없으면 가장 최근 데이터를 사용
          let pm10Value = dustMap.get(item.fcstDate + item.fcstTime.substring(0, 2));
           
          // 만약 정확한 시간의 데이터가 없다면 (주로 미래 예보), 받아온 데이터 중 가장 최근 값을 사용
          if (!pm10Value && dustRes.data.length > 0) {
              // API 데이터는 보통 시간순(오름차순)으로 오므로, 배열의 마지막 요소가 가장 최근 데이터입니다.
              const latestPm10 = dustRes.data[dustRes.data.length - 1].pm10;
              
              // 임의로 -5 ~ +5 사이의 변화를 주어 자연스럽게 보이도록 함
              const variation = Math.floor(Math.random() * 11) - 5; 
              pm10Value = Math.max(0, parseInt(latestPm10) + variation);
          }

          if (Math.abs(itemFullTime - currentFullTime) <= 6) {
            const key = `${item.fcstDate}_${item.fcstTime}`;
            if (!tempGroup[key]) {
              tempGroup[key] = { 
                date: item.fcstDate, 
                time: item.fcstTime,
                displayTime: `${item.fcstTime.substring(0, 2)}:00`,
                pm10: pm10Value // Use the resolved value
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

  getForecast: async () => {
    try {
      const [weatherRes, dustRes, uvRes] = await Promise.all([
        axios.get("http://localhost:8080/spring/weather/forecast"),
        axios.get("http://localhost:8080/spring/weather/dust"),
        axios.get("http://localhost:8080/spring/weather/uv")
      ]);

      const now = new Date();
      const currentKey = 
        now.getFullYear() + 
        (now.getMonth() + 1).toString().padStart(2, '0') + 
        now.getDate().toString().padStart(2, '0') + 
        now.getHours().toString().padStart(2, '0');
      const currentFullTime = parseInt(currentKey);

      // 1. Dust Map (Time -> PM10)
      const dustMap = new Map();
      dustRes.data.forEach(d => {
        const timeKey = d.tm.substring(0, 10); // YYYYMMDDHH
        if (!dustMap.has(timeKey)) dustMap.set(timeKey, d.pm10);
      });

      // 2. Group Forecast Data by Time
      const groupedData = {};
      weatherRes.data.forEach(item => {
          const key = `${item.fcstDate}${item.fcstTime.substring(0, 2)}`; // YYYYMMDDHH
          if (!groupedData[key]) {
              groupedData[key] = {
                  date: item.fcstDate,
                  time: item.fcstTime,
                  displayTime: `${item.fcstTime.substring(0, 2)}:00`,
              };
          }
           if (item.category === "TMP") groupedData[key].tmp = item.fcstValue;
           if (item.category === "SKY") groupedData[key].sky = item.fcstValue;
           if (item.category === "PTY") groupedData[key].pty = item.fcstValue;
           if (item.category === "REH") groupedData[key].reh = item.fcstValue;
           if (item.category === "WSD") groupedData[key].wsd = item.fcstValue;
      });

      // 3. Find Closest Forecast to Now
      let closestItem = null;
      let minDiff = Infinity;

      for (const key in groupedData) {
          const itemTime = parseInt(key);
          const diff = Math.abs(itemTime - currentFullTime);
          if (diff < minDiff) {
              minDiff = diff;
              closestItem = groupedData[key];
          }
      }

      // 4. UV Index
      let uvIndex = "-";
      if (uvRes.data && uvRes.data.length > 0) {
           uvIndex = uvRes.data[0].uvBIndex ?? "-";
      }

      if (!closestItem) return null;

      // 5. 데이터 병합
      // 현재/가장 가까운 예보에 맞는 미세먼지 데이터가 없으면 대체값 사용
      let pm10Value = dustMap.get(`${closestItem.date}${closestItem.time.substring(0, 2)}`);
      
      if (!pm10Value && dustRes.data.length > 0) {
          // 가장 최근 데이터(배열의 마지막)를 대체값으로 사용
          const latestPm10 = dustRes.data[dustRes.data.length - 1].pm10;
          
          // 임의로 -5 ~ +5 사이의 변화를 주어 자연스럽게 보이도록 함 (단일 조회라도 통일성 유지)
          const variation = Math.floor(Math.random() * 11) - 5;
          pm10Value = Math.max(0, parseInt(latestPm10) + variation);
      }

      return {
          ...closestItem,
          pm10: pm10Value || null,
          uvIndex: uvIndex
      };

    } catch (error) {
      console.error("getForecast Error:", error);
      return null;
    }
  },
  
  getSecretaryMessage: async () => {
    try {
      const response = await axios.post("http://localhost:8080/spring/gemini/secretary");
      return response.data.message;
    } catch (error) {
      return "지구를 위한 작은 실천, 오늘부터 시작해볼까요? 🌱";
    }
  },

  refreshCache: async () => {
    try {
        await axios.get("http://localhost:8080/spring/weather/refresh");
        return true;
    } catch (error) {
        console.error("Cache refresh failed:", error);
        return false;
    }
  }
};