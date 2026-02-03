

//인증된 사용자만 접근 가능한 라우트

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

//인증 사용자만 접근 가능 라우트 (로그인 한 회원)
export function PrivateRoute({children}) {

    const {isAuthenticated,isLoading} = useAuth();
    const location = useLocation();


    if(isLoading){
        return <div>로딩 중....</div>;
    }

    if(!isAuthenticated){
        //로그인 후 원래 페이지로 돌아가기 위한 위치저장
        alert('로그인 후 사용해주세요');
        return <Navigate to="/" state={{from : location}} replace/>
    }


    return children;
}

//비인증 사용자만 접근 가능한 라우트 (로그인 안한 회원 접근)
export function PublicRoute({children}){
    const {isAuthenticated,isLoading} = useAuth();
    
    if(isLoading){
        return <div>로딩 중..</div>;
    }

    if(isAuthenticated) {
        return <Navigate to="/" replace/>
    }

    return children;
}

export default PrivateRoute;