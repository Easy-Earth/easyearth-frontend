import axios from "axios";

const api = axios.create({
    baseURL : '/spring',
    timeout : 10000,
    headers : {
        'Content-Type' : 'application/json'
    }
});

// Request Interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response Interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const { response } = error;

        if(response){
            switch(response.status) {
                case 401 : // 토큰 만료
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    console.error("인증 오류 발생");
                    break;
                case 403 : // [핵심] 시큐리티 차단 시 전역 이벤트 발생
                    window.dispatchEvent(new CustomEvent("security-error", { 
                        detail: { message: "로그인이 필요한 서비스입니다." } 
                    }));
                    break;
                case 400 : console.error("잘못된 요청"); break;
                case 404 : console.error("리소스를 찾을 수 없음"); break;
                case 500 : console.error("서버 내부 오류"); break;
                default : console.error("알 수 없는 오류");
            }
        }
        return Promise.reject(error);
    }
);

export default api;