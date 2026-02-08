import axios from "axios";
import { memo, useEffect, useState } from "react";
import Modal from "../common/Modal";
import Profile from "./Profile";
import styles from "./UserDetailModal.module.css";

function UserDetailModal({ isOpen, onClose, memberId }) {
  const [userInfo, setUserInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && memberId) {
      const fetchUserData = async () => {
        setLoading(true);
        try {
          const response = await axios.get(`http://localhost:8080/spring/member/detail/${memberId}`);
          setUserInfo(response.data);
        } catch (error) {
          console.error("유저 정보 로드 실패:", error);
        } finally {
          setLoading(false);
        }
      };
      fetchUserData();
    }
  }, [isOpen, memberId]);

  // 퀴즈 정답 수에 따른 임시 레벨 계산 (예시)
  const userLevel = Math.floor((userInfo?.quizCorrectCount || 0) / 5) + 1;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`${userInfo?.name || "사용자"}님의 프로필`} size="sm">
      <div className={styles.modalBody}>
        {loading ? (
          <div className={styles.loadingWrapper}>
            <div className={styles.spinner}></div>
            <p>에코 시민 정보를 불러오는 중...</p>
          </div>
        ) : userInfo ? (
          <>
            {/* 상단 프로필 카드 영역 */}
            <div className={styles.profileHero}>
              <div className={styles.profileWrapper}>
                <Profile size="big" memberId={memberId} userName={userInfo.name} />
              </div>
              <div className={styles.userBadge}>
                {userInfo.isOnline ? "● 온라인" : "○ 오프라인"}
              </div>
            </div>

            {/* 주요 스탯 섹션 */}
            <div className={styles.statsGrid}>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>작성 리뷰</span>
                <span className={styles.statValue}>{userInfo.reviewCount}</span>
                <span className={styles.statUnit}>개</span>
              </div>
              <div className={styles.statCard}>
                <span className={styles.statLabel}>에코 레벨</span>
                <span className={`${styles.statValue} ${styles.levelText}`}>LV.{userLevel}</span>
                <span className={styles.statUnit}>시민</span>
              </div>
            </div>

            {/* 상세 정보 리스트 */}
            <div className={styles.detailContainer}>
              {/* <div className={styles.infoGroup}>
                <label>아이디</label>
                <div className={styles.infoText}>{userInfo.loginId}</div>
              </div> */}
              
              <div className={styles.infoGroup}>
                <label>가입일</label>
                <div className={styles.infoText}>{userInfo.createdAt}</div>
              </div>

              <div className={styles.infoGroup}>
                <label>지구 지킴이 한마디</label>
                <div className={styles.statusMessage}>
                  {userInfo.statusMessage || "아직 등록된 소개글이 없어요. 🌱"}
                </div>
              </div>
              
              {userInfo.address && (
                <div className={styles.infoGroup}>
                  <label>활동 지역</label>
                  <div className={styles.infoText}>📍 {userInfo.address}</div>
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}

export default memo(UserDetailModal);