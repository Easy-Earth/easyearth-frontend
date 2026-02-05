import { useEffect, useState } from "react";
import DaumPostcode from "react-daum-postcode";
import { useNavigate } from "react-router-dom";
import authApi from "../../apis/authApi";
import CustomModal from "../../components/common/CustomModal";
import { useAuth } from "../../context/AuthContext";

function SignupPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    userId: "",
    password: "",
    checkPwd: "",
    name: "",
    address: "",
    detailAddress: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // 커스텀 모달 상태 관리
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
  });

  // 1. 아이디 상태 관리
  const [idStatus, setIdStatus] = useState({ message: "", color: "#64748b", isAvailable: false });
  
  // 2. 비밀번호 일치 상태 관리
  const [pwdStatus, setPwdStatus] = useState({ message: "", color: "#64748b", isMatch: false });

  // 🚀 [실시간] 아이디 중복 체크
  useEffect(() => {
    const checkId = async () => {
      if (!formData.userId) {
        setIdStatus({ message: "", color: "#64748b", isAvailable: false });
        return;
      }
      if (formData.userId.length < 4) {
        setIdStatus({ message: "아이디는 4자 이상 입력해주세요.", color: "#ef4444", isAvailable: false });
        return;
      }
      try {
        const isAvailable = await authApi.checkIdDuplicate(formData.userId);
        if (isAvailable) {
          setIdStatus({ message: "사용 가능한 아이디입니다.", color: "#14b8a6", isAvailable: true });
        } else {
          setIdStatus({ message: "이미 사용 중인 아이디입니다.", color: "#ef4444", isAvailable: false });
        }
      } catch (err) {
        setIdStatus({ message: "중복 체크 오류", color: "#ef4444", isAvailable: false });
      }
    };

    const timeoutId = setTimeout(checkId, 500);
    return () => clearTimeout(timeoutId);
  }, [formData.userId]);

  // 🚀 [실시간] 비밀번호 일치 체크
  useEffect(() => {
    if (!formData.password || !formData.checkPwd) {
      setPwdStatus({ message: "", color: "#64748b", isMatch: false });
      return;
    }

    if (formData.password === formData.checkPwd) {
      setPwdStatus({ message: "비밀번호가 일치합니다.", color: "#14b8a6", isMatch: true });
    } else {
      setPwdStatus({ message: "비밀번호가 일치하지 않습니다.", color: "#ef4444", isMatch: false });
    }
  }, [formData.password, formData.checkPwd]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleComplete = (data) => {
    setFormData(prev => ({ ...prev, address: data.address }));
    setIsPopupOpen(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!idStatus.isAvailable) newErrors.userId = "아이디를 확인해주세요.";
    if (!pwdStatus.isMatch) newErrors.checkPwd = "비밀번호가 일치하지 않습니다.";
    if (!formData.address) newErrors.address = "주소 입력이 필요합니다.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const finalAddress = `${formData.address} ${formData.detailAddress}`.trim();
      const submitData = {
        loginId: formData.userId,
        password: formData.password,
        name: formData.name,
        address: finalAddress,
      };

      const registerResult = await register(submitData);
      if (registerResult.success) {
        const loginResult = await login({ loginId: formData.userId, password: formData.password });
        if (loginResult.success) {
          setModalConfig({
            isOpen: true,
            type: 'alert',
            message: "🎉 가입을 축하합니다!",
            onConfirm: () => {
              setModalConfig(prev => ({ ...prev, isOpen: false }));
              navigate("/", { replace: true });
            }
          });
        }
      } else {
        setModalConfig({
          isOpen: true,
          type: 'alert',
          message: registerResult.message || "회원가입 실패",
          onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
        });
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: "오류가 발생했습니다.",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "50px auto", textAlign: "center", padding: "20px", border: "1px solid #eee", borderRadius: "12px", boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}>
      <h2 style={{ marginBottom: "25px", fontWeight: "800", color: "#334155" }}>회원가입</h2>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        
        {/* 아이디 영역 */}
        <div style={{ textAlign: "left" }}>
          <input name="userId" value={formData.userId} onChange={handleChange} placeholder="아이디" style={inputStyle} />
          {idStatus.message && <div style={{ ...statusTextStyle, color: idStatus.color }}>{idStatus.message}</div>}
        </div>
        
        {/* 비밀번호 영역 */}
        <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호" style={inputStyle} />
        
        {/* 비밀번호 확인 영역 */}
        <div style={{ textAlign: "left" }}>
          <input name="checkPwd" type="password" value={formData.checkPwd} onChange={handleChange} placeholder="비밀번호 확인" style={inputStyle} />
          {pwdStatus.message && <div style={{ ...statusTextStyle, color: pwdStatus.color }}>{pwdStatus.message}</div>}
        </div>
        
        <input name="name" value={formData.name} onChange={handleChange} placeholder="이름" style={inputStyle} />

        {/* 주소 영역 */}
        <div style={{ textAlign: "left" }}>
          <div style={{ display: "flex", gap: "5px", marginBottom: "8px" }}>
            <input name="address" value={formData.address} readOnly placeholder="주소 찾기를 이용해주세요" style={inputStyle} />
            <button type="button" onClick={() => setIsPopupOpen(!isPopupOpen)} style={subButtonStyle}>주소찾기</button>
          </div>
          {isPopupOpen && (
            <div style={modalWrapperStyle}>
              <DaumPostcode onComplete={handleComplete} />
            </div>
          )}
          <input name="detailAddress" value={formData.detailAddress} onChange={handleChange} placeholder="상세주소 입력" style={inputStyle} />
          {errors.address && <span style={errorStyle}>{errors.address}</span>}
        </div>
        
        <button type="submit" disabled={loading} style={{ ...mainButtonStyle, cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.7 : 1 }}>
          {loading ? "처리 중..." : "회원가입 및 시작하기"}
        </button>
      </form>

      <CustomModal 
        isOpen={modalConfig.isOpen}
        type={modalConfig.type}
        message={modalConfig.message}
        onConfirm={modalConfig.onConfirm}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

// 공통 스타일
const inputStyle = { width: "100%", padding: "12px", border: "1px solid #e2e8f0", borderRadius: "8px", boxSizing: "border-box", outline: "none", fontSize: "14px" };
const statusTextStyle = { fontSize: "12px", marginTop: "6px", fontWeight: "600", paddingLeft: "4px" };
const subButtonStyle = { padding: "0 15px", backgroundColor: "#64748b", color: "#fff", border: "none", borderRadius: "8px", fontSize: "12px", cursor: "pointer", whiteSpace: "nowrap" };
const mainButtonStyle = { padding: "14px", backgroundColor: "#14b8a6", color: "white", border: "none", borderRadius: "8px", fontWeight: "bold", fontSize: "16px", marginTop: "10px" };
const errorStyle = { color: "#ef4444", fontSize: "12px", marginTop: "5px", display: "block" };
const modalWrapperStyle = { border: "1px solid #e2e8f0", marginTop: "10px", padding: "5px", borderRadius: "8px", overflow: "hidden" };

export default SignupPage;