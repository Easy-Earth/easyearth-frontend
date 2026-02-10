import React, { useState, useEffect } from "react";
import DaumPostcode from "react-daum-postcode";
import authApi from "../../apis/authApi";
import styles from "./EditProfilePage.module.css";

const EditProfile = ({ user }) => {
  const [formData, setFormData] = useState({
    memberId: user?.memberId || "",
    loginId: user?.loginId || "",
    name: user?.name || "",
    birthday: user?.birthday || "",
    gender: user?.gender || "",
    address: user?.address || "",
    statusMessage: user?.statusMessage || "", // 초기값 설정
    password: "",
    confirmPassword: "",
  });

  const [message, setMessage] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [pwdStatus, setPwdStatus] = useState({ message: "", color: "#64748b", isMatch: true });

  // 🚀 실시간 비밀번호 일치 체크
  useEffect(() => {
    if (!formData.password && !formData.confirmPassword) {
      setPwdStatus({ message: "", color: "#64748b", isMatch: true });
      return;
    }
    if (formData.password === formData.confirmPassword) {
      setPwdStatus({ message: "비밀번호가 일치합니다.", color: "#14b8a6", isMatch: true });
    } else {
      setPwdStatus({ message: "비밀번호가 일치하지 않습니다.", color: "#ef4444", isMatch: false });
    }
  }, [formData.password, formData.confirmPassword]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleComplete = (data) => {
    setFormData((prev) => ({ ...prev, address: data.address }));
    setIsPopupOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.password && !pwdStatus.isMatch) {
      setMessage({ type: "error", text: "비밀번호 일치 여부를 확인해주세요." });
      return;
    }

    setLoading(true);
    setMessage({ type: "", text: "" });

    try {
      // API 호출
      await authApi.updateMember(formData); 
      setMessage({ type: "success", text: "정보가 성공적으로 수정되었습니다." });
      
      // 로컬스토리지 유저 정보 동기화 (상태 메시지 포함)
      const updatedUser = { 
        ...user, 
        name: formData.name,
        address: formData.address,
        birthday: formData.birthday,
        gender: formData.gender,
        statusMessage: formData.statusMessage
      };
      localStorage.setItem("user", JSON.stringify(updatedUser));

    } catch (error) {
      const serverError = error.response?.data;
      const errorText = typeof serverError === "object" 
        ? (serverError.message || "수정 중 오류가 발생했습니다.") 
        : (serverError || "수정 중 오류가 발생했습니다.");
      setMessage({ type: "error", text: errorText });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.editFormContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.title}>회원 정보 수정</h3>
        
        {/* 아이디 (수정 불가) */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>아이디</label>
          <input type="text" value={formData.loginId} disabled className={styles.disabledInput} />
          <small className={styles.helperText}>아이디는 변경할 수 없습니다.</small>
        </div>

        {/* 이름 */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>이름</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className={styles.input}
            required
          />
        </div>

        {/* 생년월일 */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>생년월일</label>
          <input
            type="date"
            name="birthday"
            value={formData.birthday}
            onChange={handleChange}
            className={styles.input}
          />
        </div>

        {/* 성별 */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>성별</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="gender"
                value="M"
                checked={formData.gender === "M"}
                onChange={handleChange}
                className={styles.radioInput}
              /> 남성
            </label>
            <label className={styles.radioLabel}>
              <input
                type="radio"
                name="gender"
                value="F"
                checked={formData.gender === "F"}
                onChange={handleChange}
                className={styles.radioInput}
              /> 여성
            </label>
          </div>
        </div>

        {/* 상태 메시지 섹션 (현재 메시지 표시 추가) */}
        <div className={styles.inputGroup}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
            <label className={styles.label}>상태 메시지</label>
            <span style={{ fontSize: '12px', color: '#64748b' }}>
              현재: {user?.statusMessage || "없음"}
            </span>
          </div>
          <input
            type="text"
            name="statusMessage"
            value={formData.statusMessage}
            onChange={handleChange}
            className={styles.input}
            placeholder="새로운 상태 메시지를 입력하세요"
          />
        </div>

        {/* 주소 (카카오 API) */}
        <div className={styles.inputGroup}>
          <label className={styles.label}>주소</label>
          <div className={styles.addressHeader}>
            <input
              type="text"
              name="address"
              value={formData.address}
              readOnly
              className={styles.input}
              placeholder="주소를 검색하세요"
            />
            <button type="button" onClick={() => setIsPopupOpen(!isPopupOpen)} className={styles.subBtn}>
              주소찾기
            </button>
          </div>
          {isPopupOpen && (
            <div className={styles.modalWrapper}>
              <DaumPostcode onComplete={handleComplete} />
            </div>
          )}
        </div>

        <hr className={styles.divider} />
        <p className={styles.sectionTitle}>비밀번호 변경 (선택)</p>

        <div className={styles.inputGroup}>
          <label className={styles.label}>새 비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={styles.input}
            placeholder="변경 시에만 입력하세요"
          />
        </div>

        <div className={styles.inputGroup}>
          <label className={styles.label}>비밀번호 확인</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={styles.input}
            placeholder="한 번 더 입력하세요"
          />
          {pwdStatus.message && (
            <div className={styles.statusText} style={{ color: pwdStatus.color }}>
              {pwdStatus.message}
            </div>
          )}
        </div>

        {message.text && (
          <div className={`${styles.message} ${styles[message.type]}`}>
            {message.text}
          </div>
        )}

        <button type="submit" className={styles.submitBtn} disabled={loading}>
          {loading ? "처리 중..." : "정보 수정하기"}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;