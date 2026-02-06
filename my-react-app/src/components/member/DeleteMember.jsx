import React, { useState } from "react";
import authApi from "../../apis/authApi";
import styles from "./DeleteMember.module.css";

/**
 * 회원 탈퇴 컴포넌트
 * @param {Object} user - 현재 로그인한 사용자 정보
 * @param {Function} onLogout - 탈퇴 성공 후 클라이언트 상태를 로그아웃으로 변경하는 함수
 */
const DeleteAccount = ({ user, onLogout }) => {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  // 회원 탈퇴 처리 함수
  const handleDelete = async (e) => {
    e.preventDefault();
    
    // 유저 객체에서 식별 가능한 ID 추출 (다양한 DB 구조 대응)
    const userId = user?.memberId || user?.memberNo || user?.id;

    // 1. 확인 문구 검증
    if (confirmText !== "탈퇴확인") {
      alert("탈퇴 확인 문구가 일치하지 않습니다. '탈퇴확인'을 정확히 입력해주세요.");
      return;
    }

    // 2. 최종 의사 확인 (브라우저 기본 confirm 사용)
    const isFinalAnswer = window.confirm(
      "정말로 탈퇴하시겠습니까?\n이 작업은 취소할 수 없으며 모든 데이터가 즉시 삭제됩니다."
    );
    
    if (!isFinalAnswer) return;

    setLoading(true);
    try {
      // 이전에 수정한 authApi.deleteMember 호출
      const response = await authApi.deleteMember(userId, password);
      
      alert(response || "회원 탈퇴가 정상적으로 처리되었습니다. 이용해주셔서 감사합니다.");
      
      // 탈퇴 성공 시 토큰 삭제 및 메인 페이지 이동 처리
      onLogout(); 
    } catch (error) {
      // 백엔드 에러 메시지 처리 (비밀번호 불일치 등)
      console.error("탈퇴 오류:", error);
      const errorMsg = error.response?.data || "탈퇴 처리 중 예상치 못한 오류가 발생했습니다.";
      alert(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.deleteContainer}>
      <div className={styles.warningBox}>
        <h4 className={styles.warningTitle}>⚠️ 계정 삭제 전 주의사항</h4>
        <ul className={styles.warningList}>
          <li>계정 삭제 즉시 <strong>모든 개인 정보가 파기</strong>되며 복구할 수 없습니다.</li>
          <li>수집하신 <strong>아이템, 뱃지, 포인트</strong> 등 모든 자산이 삭제됩니다.</li>
          <li>기존에 작성한 활동 내역 및 퀴즈 기록은 모두 익명 처리되거나 삭제됩니다.</li>
        </ul>
      </div>

      <form onSubmit={handleDelete} className={styles.deleteForm}>
        <div className={styles.inputGroup}>
          <label htmlFor="password">본인 확인 비밀번호</label>
          <input 
            id="password"
            type="password" 
            placeholder="현재 비밀번호를 입력하세요"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div className={styles.inputGroup}>
          <label htmlFor="confirmText">
            탈퇴 확인 문구 (<strong>탈퇴확인</strong> 입력)
          </label>
          <input 
            id="confirmText"
            type="text" 
            placeholder="탈퇴확인"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className={styles.submitDeleteBtn} 
          disabled={loading}
        >
          {loading ? "탈퇴 처리 중..." : "모든 정보 삭제 및 탈퇴"}
        </button>
      </form>
    </div>
  );
};

export default DeleteAccount;