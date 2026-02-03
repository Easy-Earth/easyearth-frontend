

//인증 관련 컴포넌트 

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import authApi from "../api/authApi";

const AuthContext = createContext(null);


//인증 Provider 컴포넌트
export function AuthProvider({children}) {
    const [user,setUser] = useState(null);//사용자 정보
    const [isLoading,setIsLoading] = useState(true); //로딩정보
    const [isAuthenticated,setIsAuthenticated] = useState(false); //인증 상태

    //초기 로딩시 로컬스토리지에서 사용자 정보 찾아오기
    useEffect(()=>{
        const initAuth = async () =>{
            const token = localStorage.getItem('token');
            const savedUser = localStorage.getItem('user');

            //로컬스토리지에 토큰과 사용자정보가 있었다면
            if(token && savedUser){

                try{
                    const userData = JSON.parse(savedUser); //스토리지에 저장된 문자열기반 json데이터 json화 시키기
                    setUser(userData);
                    setIsAuthenticated(true);
                }catch(error){
                    console.error('사용자 정보 파싱오류',error);
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                }
            }
            setIsLoading(false);
        }

        //위 함수 실행
        initAuth();
    },[]);


    // 로그인

    const login = useCallback(async (credentials) =>{
        
        try{
            const data = await authApi.login(credentials);

            console.log('AuthContext');
            console.log(data);

            if(data.token){
                localStorage.setItem("token",data.token);
                localStorage.setItem('user',JSON.stringify(data.user||data)); //storage에는 문자열만 담길 수 있기때문에 문자열 처리
                setUser(data.user||data);
                setIsAuthenticated(true);

                return {success : true,data};
            }

            return {succress : false,message: '로그인에 실패했습니다.'};
        }catch(error){
            console.error('로그인 오류',error);
            return {
                success: false,
                message : error.response?.data?.message || '로그인에 실패했습니다.'
            }
        }
    },[]);

    //로그아웃
    const logout = useCallback(async ()=>{
        try { 
            await authApi.logout();

        }catch(error){
            console.error('로그아웃 API 오류 : ',error);
        }finally{
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            setUser(null);
            setIsAuthenticated(false); 
        }
    },[]);


    //사용자 정보업데이트
    const updateUser = useCallback((userData)=>{
        setUser(userData);
        localStorage.setItem('user',JSON.stringify(userData));
    },[]);


    //관리자 여부 확인
    const isAdmin = useCallback(()=>{
        return user?.role ==='ROLE_ADMIN';
    },[user]);//사용자 정보 갱신될때마다 재생성

    const filePath = '/spring/upload/';

    const value = {
        user,
        isLoading,
        isAuthenticated,
        login,
        logout,
        updateUser,
        isAdmin,
        filePath
    }; //context로 전달할 사용값들

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

//인증 Context 사용 커스텀 hook 만들기 
export function useAuth(){
    const context = useContext(AuthContext);

    if(!context){
        throw new Error('useContext 오류 발생! AuthProvider를 이용해 사용하세요!');
    }

    return context; //생성시킨 컨텍스트 반환 (사용하는 구문을 간소화하기)
}

export default AuthContext;