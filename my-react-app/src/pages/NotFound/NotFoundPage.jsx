import { useNavigate } from 'react-router-dom';
import Button from '../../components/common/Button';
import styles from './NotFoundPage.module.css';

const NotFoundPage = () => {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        {/* public 폴더에 저장한 이미지 호출 */}
        <img 
          src="/NotFound.png" 
          alt="404 캐릭터" 
          className={styles.character} 
        />
        
        <h1 className={styles.errorCode}>404</h1>
        <h2 className={styles.title}>길을 잃으셨나요?</h2>
        <p className={styles.description}>
          찾으시는 페이지가 존재하지 않거나, 잘못된 경로로 접근하셨습니다.<br />
          우리의 귀여운 에코 가이드와 함께 다시 안전한 곳으로 돌아가 볼까요?
        </p>
        
        <div className={styles.buttonGroup}>
          <Button 
            width="160px" 
            height="50px" 
            color="var(--btn-primary)" 
            onClick={() => navigate('/')}
          >
            메인으로 돌아가기
          </Button>
          <Button 
            width="160px" 
            height="50px" 
            color="#eee" 
            style={{ color: '#555' }}
            onClick={() => navigate(-1)}
          >
            이전 페이지로
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;