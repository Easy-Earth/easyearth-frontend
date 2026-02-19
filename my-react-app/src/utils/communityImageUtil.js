
/**
 * 이미지/파일 URL에 컨텍스트 경로(/spring)가 없는 경우 추가해주는 유틸리티 함수
 * @param {string} url - 원본 URL
 * @returns {string} - 컨텍스트 경로가 포함된 전체 URL
 */
export const getFullUrl2 = (url) => {
    if (!url) return "";
    // 외부 링크(http)나 이미 /spring으로 시작하는 경우 그대로 반환
    if (url.startsWith('http')) return url;
    
    // /community/file로 시작하면 백엔드 전체 경로 추가 (Vite 프록시 우회)
    if (url.startsWith('/community/file')) {
        return `http://localhost:8080/spring${url}`;
    }

    if (url.startsWith('/spring')) return `http://localhost:8080${url}`;
    
    // 그 외의 경우 (기본값)
    return url;
};
