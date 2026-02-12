//Axios 인스턴스 생성

import axios from "axios";

const api = axios.create({
    baseURL : '/spring',
    timeout : 10000,
    headers : {
        'Content-Type' : 'application/json'
    }
});


//Request Interceptor - 토큰 자동 추가 (요청 인터셉터)
api.interceptors.request.use(
    (config) =>{
        const token = localStorage.getItem('token');
        if(token){
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) =>{
        return Promise.reject(error);
    }
);


//Response Interceptor - 에러 처리 및 토큰 만료 처리
api.interceptors.response.use(
    (response)=>{
        return response;
    },
    (error) =>{
        const {response} = error;

        if(response){
            switch(response.status) {
                case 400 :
                    console.error("예외 처리입니다.");
                    break;
                case 401 : //토큰 만료 
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    //window.location.href = '/login';
                    console.error("인증 오류 발생했습니다.");
                break;
                case 403 : //권한 불충분
                    console.error('접근권한이 없습니다.');
                break;
                case 404 : //리소스 찾을 수 없음 
                    console.error('요청한 리소스를 찾을 수 없습니다.');
                break;
                case 500 : //서버 내부 오류 
                    console.error('서버 오류가 발생했습니다.');
                break;
                default : 
                    console.error('알 수 없는 오류가 발생했습니다.');
            }
        }else{
            console.error('네트워크 오류가 발생했습니다.');
        }

        return Promise.reject(error);
    }
);

export default api;//axios 인스턴스 내보내기

