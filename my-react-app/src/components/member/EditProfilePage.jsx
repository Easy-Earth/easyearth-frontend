import React, { useState, useEffect } from "react";
import DaumPostcode from "react-daum-postcode";
import authApi from "../../apis/authApi";
import styles from "./EditProfilePage.module.css";
import { uploadFile, updateProfile } from '../../apis/chatApi'; // Static import
import { getFullUrl } from '../../utils/imageUtil';

const EditProfile = ({ user }) => {
  const [formData, setFormData] = useState({
    memberId: user?.memberId || "",
    loginId: user?.loginId || "",
    name: user?.name || "",
    birthday: user?.birthday || "",
    gender: user?.gender || "",
    address: user?.address || "",
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
      // API 호출 (비밀번호가 빈 문자열이면 백엔드에서 변경 안함)
      await authApi.updateMember(formData); 
      setMessage({ type: "success", text: "정보가 성공적으로 수정되었습니다." });
      
      // 로컬스토리지 유저 정보 동기화
      const updatedUser = { 
        ...user, 
        name: formData.name,
        address: formData.address,
        birthday: formData.birthday,
        gender: formData.gender
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



// ... (existing imports)

// ... inside component ...

  // 🚀 이미지 업로드 핸들러
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // 간단한 유효성 검사
    if (!file.type.match("image.*")) {
        setMessage({ type: "error", text: "이미지 파일만 업로드 가능합니다." });
        return;
    }

    try {
        setLoading(true);
        
        console.log("Uploading profile image...");
        const fileUrl = await uploadFile(file);
        console.log("Profile image uploaded:", fileUrl);
        
        // 2. Chat API를 사용하여 프로필 URL 업데이트 (채팅 프로필)
        // user.memberId가 없을 경우를 대비해 예외 처리 또는 로깅
        if (!user.memberId) {
             console.error("Member ID is missing in user context:", user);
             throw new Error("회원 정보를 찾을 수 없습니다.");
        }

        await updateProfile(user.memberId, fileUrl);
        console.log("Profile updated via Chat API");
        
        // 3. AuthContext 상태 업데이트 (즉시 반영)
        // updateProfile은 ChatService만 갱신하므로, AuthContext의 user state도 맞춰줘야 함
        // ChatRoomList는 profileImageUrl을 사용하므로 둘 다 업데이트
        updateUser({ profileImage: fileUrl, profileImageUrl: fileUrl });
        
        setMessage({ type: "success", text: "프로필 이미지가 변경되었습니다." }); 
        
    } catch (error) {
        console.error("이미지 업로드/변경 실패:", error);
        setMessage({ type: "error", text: "이미지 변경 중 오류가 발생했습니다." });
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className={styles.editFormContainer}>
      <form onSubmit={handleSubmit} className={styles.form}>
        <h3 className={styles.title}>회원 정보 수정</h3>
        
        {/* ✨ 프로필 이미지 수정 */}
        <div className={styles.profileUploadSection} style={{ textAlign: 'center', marginBottom: '20px' }}>
            <label htmlFor="profile-upload" style={{ cursor: 'pointer', display: 'inline-block' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#eee', margin: '0 auto 10px', overflow: 'hidden', position: 'relative', border: '2px solid #ddd' }}>
                    <img 
                        src={getFullUrl(user?.profileImage) || "/default-profile.png"} 
                        alt="Profile" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => e.target.src = "/default-profile.png"} 
                    />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: 'rgba(0,0,0,0.5)', color: '#fff', fontSize: '10px', padding: '2px' }}>
                        변경
                    </div>
                </div>
            </label>
            <input 
                id="profile-upload" 
                type="file" 
                accept="image/*" 
                onChange={handleImageChange} 
                style={{ display: 'none' }}
            />
        </div>

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