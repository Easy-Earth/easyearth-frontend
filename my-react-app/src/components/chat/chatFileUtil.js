
/**
 * 파일명에서 타임스탬프와 난수 접두사를 제거하고 원본 파일명을 반환합니다.
 * 형식: 타임스탬프(14) + 난수(5) + 언더바(1) + 원본파일명
 * 예: 2024021210300012345_내문서.pdf -> 내문서.pdf
 * @param {string} url 파일 URL 또는 파일명
 * @returns {string} 원본 파일명
 */
export const extractOriginalFileName = (url) => {
    if (!url) return "";
    try {
        const decoded = decodeURIComponent(url);
        const fullFileName = decoded.split('/').pop().split('?')[0];
        
        // 타임스탬프(14) + 난수(5) + 언더바(1) = 20글자
        // 패턴 확인: 19번째 인덱스가 '_' 인지 (0부터 시작하므로 20번째 글자) -> 인덱스 19
        if (fullFileName.length > 20 && fullFileName[19] === '_') {
            return fullFileName.substring(20);
        }
        return fullFileName;
    } catch (e) {
        console.warn("파일명 추출 실패", e);
        return "파일";
    }
};
