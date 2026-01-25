export default function MyPageTabPanel({ activeTab }) {
  if (activeTab === "posts") return <div>내가 쓴 글 리스트</div>;
  if (activeTab === "diary") return <div>AI 환경 일기 요약</div>;
  if (activeTab === "items") return <div>보유 아이템 목록</div>;
  return null;
}
