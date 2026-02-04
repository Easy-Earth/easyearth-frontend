// pages/SignupPage.js
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";

function SignupPage() {
  const { register } = useAuth();

  const [formData, setFormData] = useState({
    userId: "",
    password: "",
    checkPwd: "",
    userName: "",
    address: "",
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.userId) newErrors.userId = "아이디 필수";
    if (formData.password !== formData.checkPwd) newErrors.checkPwd = "비밀번호 불일치";
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    setLoading(true);
    try {
      const submitData = {
        loginId: formData.userId,
        password: formData.password,
        userName: formData.userName,
        address: formData.address,
      };

      const result = await register(submitData);
      if (result.success) {
        alert("회원가입 완료! 로그인 해주세요.");
        // 회원가입 성공 후 메인페이지 또는 로그인 모달로 이동 가능
      } else {
        alert(result.message || "회원가입 실패");
      }
    } catch (err) {
      alert("회원가입 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <input name="userId" value={formData.userId} onChange={handleChange} placeholder="아이디" />
      {errors.userId && <span style={{ color: "red" }}>{errors.userId}</span>}
      
      <input name="password" type="password" value={formData.password} onChange={handleChange} placeholder="비밀번호" />
      <input name="checkPwd" type="password" value={formData.checkPwd} onChange={handleChange} placeholder="비밀번호 확인" />
      {errors.checkPwd && <span style={{ color: "red" }}>{errors.checkPwd}</span>}
      
      <input name="userName" value={formData.userName} onChange={handleChange} placeholder="이름" />
      <input name="address" value={formData.address} onChange={handleChange} placeholder="주소" />
      
      <button type="submit" disabled={loading}>회원가입</button>
    </form>
  );
}

export default SignupPage;
