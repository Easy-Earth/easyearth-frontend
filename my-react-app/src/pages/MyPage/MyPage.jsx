import { useCallback, useState } from "react";
import styles from "./MyPage.module.css";

import ItemPickerModal from "../../components/mypage/ItemPickerModal";
import MyPageTabPanel from "../../components/mypage/MyPageTabPanel";
import MyPageTabs from "../../components/mypage/MyPageTabs";
import PointWallet from "../../components/mypage/PointWallet";
import ProfileSection from "../../components/mypage/ProfileSection";
import StatSummary from "../../components/mypage/StatSummary";

const TABS = [
  { key: "posts", label: "내가 쓴 글" },
  { key: "diary", label: "환경 일기" },
  { key: "items", label: "보유 아이템" },
];

const DUMMY = {
  user: {
  presetId: "legendary-6",
  profileImage: "https://placehold.co/72x72",
  titleId: "normal-1",
  badgeId: "legendary-1",
  userName: "유지훈",

  nickname: "닉네임",
  id: "testId",
  region: "서울 · 강남구",
  address: "서울시 강남구 어딘가 123",
  gender: "M",
  birth: "2002-05-12",
  },
  impact: {
    completedQuests: 27,
    totalCo2Gram: 18450,
    totalTreeCount: 12,
  },
  wallet: {
    nowPoint: 1320,
    totalEarnedPoint: 4200,
    totalSpentPoint: 2880,
  },
};

export default function MyPage() {
  const [activeTab, setActiveTab] = useState("posts");
  const [modalType, setModalType] = useState(null);

  const openModal = useCallback((type) => setModalType(type), []);
  const closeModal = useCallback(() => setModalType(null), []);

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <ProfileSection user={DUMMY.user} onOpenModal={openModal} />

        <div className={styles.grid}>
          <StatSummary impact={DUMMY.impact} />
          <PointWallet wallet={DUMMY.wallet} />
        </div>

        <MyPageTabs
          tabs={TABS}
          activeTab={activeTab}
          onChange={setActiveTab}
        />

        <MyPageTabPanel activeTab={activeTab} />
      </div>

      {modalType && (
        <ItemPickerModal type={modalType} onClose={closeModal} />
      )}
    </div>
  );
}
