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
                case 403 : // 시큐리티 차단 시 전역 이벤트 발생
                    // [Fix] 이미 로그인 토큰이 있는데 403이 왔다면 '로그인 필요'가 아닌 '권한 부족' 상태임.
                    // 채팅방 나가기 직후 발생하는 일시적 403 에러로 인한 '로그인 필요' 모달 팝업 방지.
                    if (!localStorage.getItem('token')) {
                        window.dispatchEvent(new CustomEvent("security-error", { 
                            detail: { message: "로그인이 필요한 서비스입니다." } 
                        }));
                    } else {
                        console.warn("접근 권한이 없거나 일시적인 권한 오류입니다. (403)");
                    }
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