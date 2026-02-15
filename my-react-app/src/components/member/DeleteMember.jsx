import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import authApi from "../../apis/authApi";
import styles from "./DeleteMember.module.css";
import CustomModal from "../../components/common/CustomModal"; // 모달 컴포넌트 임포트

/**
 * 회원 탈퇴 컴포넌트
 * @param {Object} user - 현재 로그인한 사용자 정보
 * @param {Function} onLogout - 탈퇴 성공 후 클라이언트 상태를 로그아웃으로 변경하는 함수
 */
const DeleteAccount = ({ user, onLogout }) => {
  const [password, setPassword] = useState("");
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // 모달 상태 관리
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: "",
    message: "",
    type: "alert",
    onConfirm: () => {},
  });

  // 모달 닫기 함수
  const closeModal = () => {
    setModalConfig((prev) => ({ ...prev, isOpen: false }));
  };

  // 모달 호출 유틸리티
  const showAlert = (message, title = "알림") => {
    setModalConfig({
      isOpen: true,
      title,
      message,
      type: "alert",
      onConfirm: closeModal,
    });
  };

  // 회원 탈퇴 처리 함수
  const handleDelete = async (e) => {
    e.preventDefault();

    // 유저 객체에서 식별 가능한 ID 추출
    const userId = user?.memberNo || user?.memberId || user?.id;

    // 1. 확인 문구 검증
    if (confirmText !== "탈퇴확인") {
      showAlert("'탈퇴확인' 문구를 정확히 입력해주세요.", "입력 오류");
      return;
    }

    // 2. 최종 의사 확인 (CustomModal 사용)
    setModalConfig({
      isOpen: true,
      title: "계정 탈퇴 확인",
      message: "정말로 탈퇴하시겠습니까?\n이 작업은 취소할 수 없으며 모든 데이터가 즉시 삭제됩니다.",
      type: "confirm",
      onConfirm: () => processDelete(userId), // 확인 클릭 시 실제 삭제 로직 실행
    });
  };

  // 실제 API 호출 로직
  const processDelete = async (userId) => {
    closeModal();
    setLoading(true);
    try {
      const response = await authApi.deleteMember(userId, password);

      // 성공 모달 표시
      setModalConfig({
        isOpen: true,
        title: "탈퇴 완료",
        message: response || "회원 탈퇴가 정상적으로 처리되었습니다. 이용해주셔서 감사합니다.",
        type: "alert",
        onConfirm: () => {
          if (onLogout) onLogout();
          navigate("/");
        },
      });
    } catch (error) {
      console.error("탈퇴 오류:", error);
      const errorMsg = error.response?.data || "탈퇴 처리 중 예상치 못한 오류가 발생했습니다.";
      showAlert(errorMsg, "오류 발생");
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

      {/* 커스텀 모달 컴포넌트 UI 추가 */}
      <CustomModal
        isOpen={modalConfig.isOpen}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
        onConfirm={modalConfig.onConfirm}
        onCancel={closeModal}
      />
    </div>
  );
};

export default DeleteAccount;