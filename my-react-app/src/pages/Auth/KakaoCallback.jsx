import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import authApi from '../../apis/authApi';
import CustomModal from '../../components/common/CustomModal';
import { useAuth } from '../../context/AuthContext';

const KakaoCallback = () => {
  const navigate = useNavigate();
  const { login } = useAuth(); 
  const isProcessed = useRef(false);

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {}
  });

  useEffect(() => {
    const processKakaoLogin = async () => {
      const code = new URL(window.location.href).searchParams.get("code");
      if (!code || isProcessed.current) return;

      try {
        isProcessed.current = true;
        const data = await authApi.kakaoLogin(code);

        if (data.isMember) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("user", JSON.stringify(data.user));

          setModalConfig({
            isOpen: true,
            title: '로그인 성공',
            message: `${data.user.name}님, 반갑습니다!`,
            onConfirm: () => {
              window.location.href = "/"; 
            }
          });
        } else {
          setModalConfig({
            isOpen: true,
            title: '회원가입 필요',
            message: '가입된 정보가 없어 회원가입 페이지로 이동합니다.',
            onConfirm: () => {
              navigate("/join", { 
                state: { kakaoId: data.kakaoId, nickname: data.nickname },
                replace: true 
              });
            }
          });
        }
      } catch (error) {
        console.error("카카오 로그인 프로세스 에러:", error);
        setModalConfig({
          isOpen: true,
          title: '로그인 실패',
          message: '로그인 처리 중 오류가 발생했습니다.',
          onConfirm: () => navigate("/", { replace: true })
        });
      }
    };

    processKakaoLogin();
  }, [navigate]);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
      <h3>로그인 처리 중...</h3>
      <CustomModal 
        {...modalConfig}
        onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default KakaoCallback;