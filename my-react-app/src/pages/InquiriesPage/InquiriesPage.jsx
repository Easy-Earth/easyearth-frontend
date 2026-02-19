import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { inquiriesApi } from "../../apis/inquiriesApi.js";
import Button from "../../components/common/Button.jsx";
import CustomModal from "../../components/common/CustomModal.jsx";
import Input from "../../components/common/Input.jsx";
import InquiriesStatusModal from "../../components/inquiries/InquiriesStatusModal.jsx";
import InquiriesWriteModal from "../../components/inquiries/InquiriesWriteModal.jsx";
import Pagination from "../../components/pagination/Pagination.jsx";
import { useAuth } from "../../context/AuthContext";

import styles from "./InquiriesPage.module.css";

const InquiriesPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  
  const [list, setList] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [status, setStatus] = useState("");
  const [condition, setCondition] = useState("title");
  const [keyword, setKeyword] = useState("");
  const PAGE_SIZE = 10;

  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: () => {},
  });

  const statusTabs = [
    { label: "전체", value: "" },
    { label: "접수완료", value: "SUBMITTED" },
    { label: "진행중", value: "PROCESSING" },
    { label: "답변완료", value: "COMPLETED" },
  ];

  const loadInquiriesList = async (page = 1) => {
    setLoading(true);
    setError("");
    const targetPage = typeof page === "number" ? page : 1;

    try {
      const params = { page: targetPage, size: PAGE_SIZE };
      if (status) params.status = status;
      if (keyword.trim()) {
        params.condition = condition;
        params.keyword = keyword.trim();
      }

      const data = await inquiriesApi.inquiriesList(params);

      setList(data?.list ?? []);
      setPageInfo({
        listCount: data?.listCount ?? 0,
        currentPage: data?.currentPage ?? targetPage,
        maxPage: data?.maxPage ?? 1,
        startPage: data?.startPage ?? 1,
        endPage: data?.endPage ?? 1,
      });
    } catch (e) {
      console.error(e);
      setError("건의글 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInquiriesList(1);
  }, [status]);

  const getStatusBadgeClass = (st) => {
    if (st === "SUBMITTED") return styles.badgeSubmitted;
    if (st === "PROCESSING") return styles.badgeProcessing;
    if (st === "COMPLETED") return styles.badgeCompleted;
    return styles.badgeDefault;
  };

  const handleWriteClick = () => {
    if (!isAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return;
    }
    setIsWriteModalOpen(true);
  };

  const handleStatusClick = (inquiry, e) => {
    e.stopPropagation();
    setSelectedInquiry(inquiry);
    setIsStatusModalOpen(true);
  };

  const handleWriteSuccess = (message) => {
    setAlertConfig({
      isOpen: true,
      type: "confirm",
      message: message || "건의글이 등록되었습니다.",
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, isOpen: false }));
        loadInquiriesList(1);
      },
    });
  };

  // 비공개글 클릭 권한 체크 로직 추가
  const handleDetailClick = (inquiry) => {
    const isOwner = user && Number(user.memberId) === Number(inquiry.memberId);
    const isAdmin = user && Number(user.memberId) === 1;

    if (inquiry.isPublic === "N" && !isOwner && !isAdmin) {
      setAlertConfig({
        isOpen: true,
        type: "alert",
        message: "비공개 건의글은 작성자와 관리자만 확인할 수 있습니다.",
        onConfirm: () => setAlertConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    navigate(`/inquiries/detail/${inquiry.inquiriesId}`);
  };

  return (
    <div className={styles.page}>
      <div className={styles.frame}>

        <div className={styles.titleArea}>
          <h1 className={styles.title}>📬 건의사항</h1>
        </div>

        <div className={styles.topRow}>
          <div className={styles.tabs}>
            {statusTabs.map((t) => (
              <button
                key={t.value || "ALL"}
                type="button"
                className={`${styles.tab} ${status === t.value ? styles.tabActive : ""}`}
                onClick={() => setStatus(t.value)}
              >
                {t.label}
              </button>
            ))}
          </div>
          <Button
            width="130px"
            height="40px"
            color="var(--btn-primary)"
            hover="var(--btn-primary-hover)"
            type="button"
            onClick={handleWriteClick}
          >
            <span style={{ fontWeight: 900 ,color: "#fff"}}>✏️ 글쓰기</span>
          </Button>
        </div>

        <p className={styles.listMeta}>
          총 <em>{pageInfo.listCount ?? 0}</em>개의 건의글
        </p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.cardList}>
          {loading ? (
            <div className={styles.empty}>로딩 중...</div>
          ) : list.length === 0 ? (
            <div className={styles.empty}>건의글이 없습니다.</div>
          ) : (
            list.map((inquiry) => (
              <div
                key={inquiry.inquiriesId}
                className={`${styles.card} ${inquiry.isFaq === "Y" ? styles.cardFaq : ""}`}
                onClick={() => handleDetailClick(inquiry)}
              >
                {inquiry.isPublic === "N" && <span className={styles.badgePrivate}>🔒</span>}
                
                <div className={styles.cardHeader}>
                  {inquiry.isFaq === "Y" && <span className={styles.badgeFaq}>FAQ</span>}
                  <span className={`${styles.badge} ${getStatusBadgeClass(inquiry.status)}`}>
                    {inquiry.status === "SUBMITTED" && "접수완료"}
                    {inquiry.status === "PROCESSING" && "진행중"}
                    {inquiry.status === "COMPLETED" && "답변완료"}
                  </span>
                  <span className={styles.writer}>{inquiry.name}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.date}>{String(inquiry.updatedAt ?? "").slice(0, 10)}</span>
                </div>

                <div className={styles.cardBody}>
                  <h3 className={styles.cardTitle}>{inquiry.title}</h3>
                  <p className={styles.cardContent}>
                    {inquiry.content?.length > 100 ? inquiry.content.slice(0, 100) + "..." : inquiry.content}
                  </p>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.statItem}>👁️ {inquiry.viewCount}</div>
                  {user?.memberId === 1 && (
                    <button 
                      className={styles.statusManageBtn} 
                      onClick={(e) => handleStatusClick(inquiry, e)}
                    >
                      ⚙️ 상태 관리
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <Pagination
          pageInfo={pageInfo}
          onChangePage={loadInquiriesList}
          disabled={loading}
        />

        <form
          className={styles.searchWrap}
          onSubmit={(e) => {
            e.preventDefault();
            loadInquiriesList(1);
          }}
        >
          <select
            className={styles.searchSelect}
            value={condition}
            onChange={(e) => setCondition(e.target.value)}
          >
            <option value="title">제목</option>
            <option value="content">내용</option>
            <option value="writer">작성자</option>
          </select>
          <div className={styles.searchInputWrap}>
            <Input
              fullWidth
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="검색어를 입력하세요"
              style={{ backgroundColor: "var(--gray-50)", paddingLeft: "16px" }}
            />
          </div>
          <button className={styles.searchBtn} type="submit">검색</button>
        </form>

        <InquiriesWriteModal
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
          onSuccess={handleWriteSuccess}
        />

        <InquiriesStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          inquiry={selectedInquiry}
          onSuccess={handleWriteSuccess}
        />

        <CustomModal
          isOpen={alertConfig.isOpen}
          type={alertConfig.type}
          message={alertConfig.message}
          onConfirm={alertConfig.onConfirm}
          onCancel={() => setAlertConfig((prev) => ({ ...prev, isOpen: false }))}
        />

      </div>
    </div>
  );
};

export default InquiriesPage;