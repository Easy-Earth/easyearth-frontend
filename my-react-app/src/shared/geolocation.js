// 현재 위치(위도/경도) 가져오기 Promise 버전~멍♡
export const geo = {
  getCurrentPosition: (options = {}) => {
    const defaultOptions = {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0,
      ...options,
    };

    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("이 브라우저는 위치 서비스를 지원하지 않습니다."));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          resolve({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        (err) => reject(err),
        defaultOptions
      );
    });
  },
};

export default geo;
