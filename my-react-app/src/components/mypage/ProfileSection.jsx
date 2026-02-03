import { useMemo } from "react";
import Profile from "../common/Profile";
import styles from "./ProfileSection.module.css";

export default function ProfileSection({ user, onOpenModal }) {
  const profileProps = useMemo(
    () => ({
      presetId: user?.presetId ?? "normal-1",
      profileImage: user?.profileImage ?? "https://placehold.co/72x72",
      titleId: user?.titleId ?? "normal-1",
      badgeId: user?.badgeId ?? "normal-1",
      userName: user?.userName ?? user?.nickname ?? "사용자",
    }),
    [user]
  );

  return (
    <section className={styles.wrap}>
      <div className={styles.inner}>
        {/* 왼쪽: 프로필 카드 */}
        <div className={styles.profileCard}>
          <Profile {...profileProps} />
        </div>

        {/* 오른쪽: 사용자 상세 정보(세로) + 변경 버튼들 */}
        <div className={styles.info}>
          <div className={styles.header}>
            <h3 className={styles.headerTitle}>사용자 정보</h3>
            <p className={styles.headerDesc}>
              
            </p>
          </div>

          <div className={styles.form}>
            <div className={styles.field}>
              <label className={styles.label}>이름</label>
              <input
                className={styles.input}
                value={user?.userName ?? user?.name ?? ""}
                placeholder="이름"
                disabled
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>닉네임</label>
              <input
                className={styles.input}
                value={user?.nickname ?? ""}
                placeholder="닉네임"
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>주소</label>
              <input
                className={styles.input}
                value={user?.address ?? ""}
                placeholder="주소"
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>성별</label>
              <input
                className={styles.input}
                value={user?.gender ?? ""}
                placeholder="성별"
                disabled
                readOnly
              />
            </div>

            <div className={styles.field}>
              <label className={styles.label}>생년월일</label>
              <input
                className={styles.input}
                value={user?.birth ?? user?.birthday ?? ""}
                placeholder="YYYY-MM-DD"
                readOnly
              />
            </div>
          </div>

          <div className={styles.divider} />

          <div className={styles.changeArea}>
            <div className={styles.changeTitle}>아이템 변경</div>

            <div className={styles.actions}>
              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onOpenModal("title")}
              >
                칭호 변경
              </button>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onOpenModal("badge")}
              >
                뱃지 변경
              </button>

              <button
                type="button"
                className={styles.actionBtn}
                onClick={() => onOpenModal("bg")}
              >
                프로필 배경 변경
              </button>
            </div>

            <div className={styles.helper}>
              
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
