import { useEffect, useState } from "react";
import DaumPostcode from "react-daum-postcode";
import { useLocation, useNavigate } from "react-router-dom"; // ✨ useLocation 추가
import authApi from "../../apis/authApi";
import CustomModal from "../../components/common/CustomModal";
import { useAuth } from "../../context/AuthContext";
import styles from "./SignupPage.module.css";

function SignupPage() {
  const { register, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // ✨ 카카오로부터 넘어온 state를 받기 위함
  const kakaoData = location.state; // { kakaoId, nickname }

  const [formData, setFormData] = useState({
    userId: "",
    password: "",
    checkPwd: "",
    name: "",
    birthday: "",
    gender: "",
    address: "",
    detailAddress: "",
    statusMessage: "",
  });

  // ✨ 페이지 진입 시 카카오 데이터가 있다면 폼에 셋팅
  useEffect(() => {
    if (kakaoData) {
      setFormData(prev => ({
        ...prev,
        userId: kakaoData.kakaoId,
        name: kakaoData.nickname || "",
        password: "KAKAO_AUTH_USER", // 카카오 유저용 임시 비번 (백엔드 암호화됨)
        checkPwd: "KAKAO_AUTH_USER"
      }));
      // 카카오 ID는 이미 검증된 것이므로 사용 가능 처리
      setIdStatus({ message: "카카오 인증 아이디입니다.", color: "#14b8a6", isAvailable: true });
    }
  }, [kakaoData]);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: 'alert',
    message: '',
    onConfirm: () => {}
  });

  const [idStatus, setIdStatus] = useState({ message: "", color: "#64748b", isAvailable: false });
  const [pwdStatus, setPwdStatus] = useState({ message: "", color: "#64748b", isMatch: false });

  // 실시간 아이디 중복 체크
  useEffect(() => {
    // ✨ 카카오 가입 시에는 중복 체크 로직 건너뜀
    if (kakaoData) return;

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
  }, [formData.userId, kakaoData]);

  // 실시간 비밀번호 일치 체크
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
    if (!idStatus.isAvailable) newErrors.userId = "아이디 중복 확인이 필요합니다.";
    if (!pwdStatus.isMatch) newErrors.checkPwd = "비밀번호가 서로 다릅니다.";
    if (!formData.name) newErrors.name = "이름을 입력해주세요.";
    if (!formData.birthday) newErrors.birthday = "생년월일을 선택해주세요.";
    if (!formData.gender) newErrors.gender = "성별을 선택해주세요.";
    if (!formData.address) newErrors.address = "주소 검색을 완료해주세요.";

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const finalAddress = `${formData.address} ${formData.detailAddress}`.trim();
      const submitData = {
        loginId: formData.userId,
        password: formData.password,
        name: formData.name,
        birthday: formData.birthday,
        gender: formData.gender,
        address: finalAddress,
        statusMessage: formData.statusMessage,
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
        throw new Error(registerResult.message || "회원가입 실패");
      }
    } catch (err) {
      setModalConfig({
        isOpen: true,
        type: 'alert',
        message: err.message || "오류가 발생했습니다.",
        onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.title}>이지어스 가입하기</h2>
      <form onSubmit={handleSubmit} className={styles.form}>
        
        <div className={styles.fieldContainer}>
          <label className={styles.label}>아이디</label>
          {/* ✨ 카카오 가입 시 아이디는 readOnly 처리 */}
          <input 
            name="userId" 
            value={formData.userId} 
            onChange={handleChange} 
            placeholder="4자 이상 입력" 
            className={styles.input} 
            readOnly={!!kakaoData}
          />
          {idStatus.message && <div className={styles.statusText} style={{ color: idStatus.color }}>{idStatus.message}</div>}
          {errors.userId && <span className={styles.error}>{errors.userId}</span>}
        </div>
        
        {/* ✨ 카카오 가입 시 비밀번호 필드는 숨김(가독성을 위해) 혹은 readOnly 처리 */}
        <div className={styles.fieldContainer} style={{ display: kakaoData ? 'none' : 'block' }}>
          <label className={styles.label}>비밀번호</label>
          <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호" className={styles.input} />
        </div>
        
        <div className={styles.fieldContainer} style={{ display: kakaoData ? 'none' : 'block' }}>
          <label className={styles.label}>비밀번호 확인</label>
          <input name="checkPwd" type="password" value={formData.checkPwd} onChange={handleChange} placeholder="비밀번호 다시 입력" className={styles.input} />
          {pwdStatus.message && <div className={styles.statusText} style={{ color: pwdStatus.color }}>{pwdStatus.message}</div>}
          {errors.checkPwd && <span className={styles.error}>{errors.checkPwd}</span>}
        </div>
        
        <div className={styles.fieldContainer}>
          <label className={styles.label}>이름</label>
          <input name="name" value={formData.name} onChange={handleChange} placeholder="실명 입력" className={styles.input} />
          {errors.name && <span className={styles.error}>{errors.name}</span>}
        </div>

        <div className={styles.fieldContainer}>
          <label className={styles.label}>생년월일</label>
          <input name="birthday" type="date" value={formData.birthday} onChange={handleChange} className={styles.input} />
          {errors.birthday && <span className={styles.error}>{errors.birthday}</span>}
        </div>

        <div className={styles.fieldContainer}>
          <label className={styles.label}>성별</label>
          <div className={styles.radioGroup}>
            <label className={styles.radioLabel}>
              <input type="radio" name="gender" value="M" checked={formData.gender === "M"} onChange={handleChange} className={styles.radioInput} /> 남성
            </label>
            <label className={styles.radioLabel}>
              <input type="radio" name="gender" value="F" checked={formData.gender === "F"} onChange={handleChange} className={styles.radioInput} /> 여성
            </label>
          </div>
          {errors.gender && <span className={styles.error}>{errors.gender}</span>}
        </div>

        <div className={styles.fieldContainer}>
          <label className={styles.label}>상태 메시지</label>
          <input 
            name="statusMessage" 
            value={formData.statusMessage} 
            onChange={handleChange} 
            placeholder="자신을 소개하는 한마디를 입력하세요 (선택)" 
            className={styles.input} 
          />
        </div>

        <div className={styles.fieldContainer}>
          <label className={styles.label}>주소</label>
          <div className={styles.addressGroup}>
            <input name="address" value={formData.address} readOnly placeholder="주소 찾기 클릭" className={styles.input} />
            <button type="button" onClick={() => setIsPopupOpen(!isPopupOpen)} className={styles.subBtn}>검색</button>
          </div>
          {isPopupOpen && (
            <div className={styles.modalWrapper}>
              <DaumPostcode onComplete={handleComplete} />
            </div>
          )}
          <input name="detailAddress" value={formData.detailAddress} onChange={handleChange} placeholder="상세주소 입력" className={styles.input} />
          {errors.address && <span className={styles.error}>{errors.address}</span>}
        </div>
        
        <button type="submit" disabled={loading} className={styles.mainBtn}>
          {loading ? "처리 중..." : "회원가입 완료"}
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

export default SignupPage;