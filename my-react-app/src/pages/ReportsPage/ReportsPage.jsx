import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { reportsApi } from "../../apis/reportsApi.js";
import { useAuth } from "../../context/AuthContext";
import Input from "../../components/common/Input.jsx";
import ReportStatusModal from "../../components/reports/ReportStatusModal.jsx";
import CustomModal from "../../components/common/CustomModal.jsx";

import styles from "./ReportsPage.module.css";

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [pageInfo, setPageInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [type, setType] = useState("");
  const [reason, setReason] = useState("");
  const [condition, setCondition] = useState("title");
  const [keyword, setKeyword] = useState("");

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  const [alertConfig, setAlertConfig] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: () => {},
  });

  // 각 칸반별 페이지 state 추가
  const [receivedPage, setReceivedPage] = useState(1);
  const [resolvedPage, setResolvedPage] = useState(1);
  const [rejectedPage, setRejectedPage] = useState(1);
  
  // 각 칸반별 데이터
  const [receivedList, setReceivedList] = useState([]);
  const [resolvedList, setResolvedList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  
  // 더 불러올 데이터가 있는지
  const [hasMoreReceived, setHasMoreReceived] = useState(true);
  const [hasMoreResolved, setHasMoreResolved] = useState(true);
  const [hasMoreRejected, setHasMoreRejected] = useState(true);
  
  const ITEMS_PER_PAGE = 10;

  const typeTabs = [
    { label: "전체", value: "" },
    { label: "게시글", value: "POST" },
    { label: "댓글", value: "REPLY" },
    { label: "리뷰", value: "REVIEW"},
  ];

  const reasonTabs = [
    { label: "전체", value: "" },
    { label: "부적절한 콘텐츠", value: "부적절한 콘텐츠" },
    { label: "스팸/홍보성", value: "스팸/홍보성" },
    { label: "욕설/비방", value: "욕설/비방" },
    { label: "기타", value: "기타" },
  ];

  // 각 상태별로 데이터 로드
  const loadReportsByStatus = async (status, page, append = false) => {
    setLoading(true);
    try {
      const params = { 
        page, 
        size: ITEMS_PER_PAGE,
        status 
      };
      if (type) params.type = type;
      if (reason) params.reason = reason;
      if (keyword.trim()) {
        params.condition = condition;
        params.keyword = keyword.trim();
      }

      const data = await reportsApi.reportsList(params);
      const newList = data?.list ?? [];

      if (status === 'RECEIVED') {
        setReceivedList(prev => append ? [...prev, ...newList] : newList);
        setHasMoreReceived(newList.length === ITEMS_PER_PAGE);
      } else if (status === 'RESOLVED') {
        setResolvedList(prev => append ? [...prev, ...newList] : newList);
        setHasMoreResolved(newList.length === ITEMS_PER_PAGE);
      } else if (status === 'REJECTED') {
        setRejectedList(prev => append ? [...prev, ...newList] : newList);
        setHasMoreRejected(newList.length === ITEMS_PER_PAGE);
      }

      // 전체 카운트 업데이트
      if (!append) {
        setPageInfo(prev => ({
          ...prev,
          listCount: data?.listCount ?? 0
        }));
      }
    } catch (e) {
      console.error(e);
      setError("신고 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    setReceivedPage(1);
    setResolvedPage(1);
    setRejectedPage(1);
    
    loadReportsByStatus('RECEIVED', 1);
    loadReportsByStatus('RESOLVED', 1);
    loadReportsByStatus('REJECTED', 1);
  }, [type, reason, keyword]);

  // 스크롤 핸들러
  const handleScroll = (e, status) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    // 스크롤이 거의 끝에 도달했을 때
    if (scrollHeight - scrollTop <= clientHeight + 50) {
      if (status === 'RECEIVED' && hasMoreReceived && !loading) {
        const nextPage = receivedPage + 1;
        setReceivedPage(nextPage);
        loadReportsByStatus('RECEIVED', nextPage, true);
      } else if (status === 'RESOLVED' && hasMoreResolved && !loading) {
        const nextPage = resolvedPage + 1;
        setResolvedPage(nextPage);
        loadReportsByStatus('RESOLVED', nextPage, true);
      } else if (status === 'REJECTED' && hasMoreRejected && !loading) {
        const nextPage = rejectedPage + 1;
        setRejectedPage(nextPage);
        loadReportsByStatus('REJECTED', nextPage, true);
      }
    }
  };

  const getTypeBadgeClass = (t) => {
    if (t === "POST") return styles.badgePost;
    if (t === "REPLY") return styles.badgeReply;
    if (t === "REVIEW") return styles.badgeReview;
    return styles.badgeDefault;
  };

  const handleStatusClick = (report, e) => {
    e.stopPropagation();
    setSelectedReport(report);
    setIsStatusModalOpen(true);
  };

  const handleStatusSuccess = (message) => {
    setAlertConfig({
      isOpen: true,
      type: "confirm",
      message: message || "상태가 변경되었습니다.",
      onConfirm: () => {
        setAlertConfig((prev) => ({ ...prev, isOpen: false }));
        // 전체 다시 로드
        setReceivedPage(1);
        setResolvedPage(1);
        setRejectedPage(1);
        loadReportsByStatus('RECEIVED', 1);
        loadReportsByStatus('RESOLVED', 1);
        loadReportsByStatus('REJECTED', 1);
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.frame}>

        <div className={styles.titleArea}>
          <h1 className={styles.title}>🚨 신고 관리</h1>
        </div>

        {/* 필터 영역 */}
        <div className={styles.filterContainer}>
          <div className={styles.filterRow}>
            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>신고 대상:</span>
              <div className={styles.tabs}>
                {typeTabs.map((t) => (
                  <button
                    key={t.value || "ALL"}
                    type="button"
                    className={`${styles.tab} ${type === t.value ? styles.tabActive : ""}`}
                    onClick={() => setType(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>

            <div className={styles.filterGroup}>
              <span className={styles.filterLabel}>신고 사유:</span>
              <div className={styles.tabs}>
                {reasonTabs.map((t) => (
                  <button
                    key={t.value || "ALL"}
                    type="button"
                    className={`${styles.tab} ${reason === t.value ? styles.tabActive : ""}`}
                    onClick={() => setReason(t.value)}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 검색바 */}
          <div className={styles.filterRow}>
            <span className={styles.filterLabel}>검색:</span>
            <form
              className={styles.searchForm}
              onSubmit={(e) => {
                e.preventDefault();
                setReceivedPage(1);
                setResolvedPage(1);
                setRejectedPage(1);
                loadReportsByStatus('RECEIVED', 1);
                loadReportsByStatus('RESOLVED', 1);
                loadReportsByStatus('REJECTED', 1);
              }}
            >
              <select
                className={styles.searchSelect}
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
              >
                <option value="memberId">신고자</option>
                <option value="targetMemberId">신고 대상</option>
                <option value="detail">내용</option>
              </select>
              <div className={styles.searchInputWrap}>
                <Input
                  fullWidth
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder="검색어를 입력하세요"
                  style={{ backgroundColor: "#fff", paddingLeft: "16px" }}
                />
              </div>
              <button className={styles.searchBtn} type="submit">검색</button>
            </form>
          </div>
        </div>

        <p className={styles.listMeta}>
          총 <em>{receivedList.length + resolvedList.length + rejectedList.length}</em>개의 신고
        </p>

        {error && <div className={styles.errorBox}>{error}</div>}

        <div className={styles.kanbanContainer}>
          <div className={styles.kanbanColumn}>
            <div className={`${styles.columnHeader} ${styles.received}`}>
              <span className={styles.columnTitle}>📝 접수완료</span>
              <span className={styles.columnCount}>
                ({receivedList.length})
              </span>
            </div>
            <div 
              className={styles.cardList}
              onScroll={(e) => handleScroll(e, 'RECEIVED')}
            >
              {receivedList.length === 0 ? (
                <div className={styles.empty}>접수완료 신고가 없습니다.</div>
              ) : (
                <>
                  {receivedList.map((report) => (
                    <div
                      key={report.reportsId}
                      className={styles.card}
                      onClick={() => navigate(`/reports/detail/${report.reportsId}`)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={`${styles.badge} ${getTypeBadgeClass(report.type)}`}>
                          {report.type === "POST" && "게시글"}
                          {report.type === "REPLY" && "댓글"}
                          {report.type === "REVIEW" && "리뷰"}
                        </span>
                        <span className={styles.date}>{String(report.createdAt ?? "").slice(0, 10)}</span>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>신고 사유: {report.reason}</div>
                        <p className={styles.cardContent}>
                          {report.detail?.length > 80 ? report.detail.slice(0, 80) + "..." : report.detail}
                        </p>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.userInfo}>
                          <div className={styles.userItem}>
                            <span className={styles.userIcon}>👤</span>
                            <span className={styles.userName}>{report.memberName || report.memberId}</span>
                          </div>
                          <span className={styles.arrow}>→</span>
                          <div className={styles.userItem}>
                            <span className={styles.userIcon}>🎯</span>
                            <span className={styles.userName}>{report.targetMemberName || report.targetMemberId}</span>
                          </div>
                        </div>
                        {user?.memberId === 1 && (
                          <button 
                            className={styles.statusManageBtn} 
                            onClick={(e) => handleStatusClick(report, e)}
                          >
                            ⚙️ 상태 관리
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && <div className={styles.loading}>로딩 중...</div>}
                </>
              )}
            </div>
          </div>

          <div className={styles.kanbanColumn}>
            <div className={`${styles.columnHeader} ${styles.resolved}`}>
              <span className={styles.columnTitle}>✅ 처리완료</span>
              <span className={styles.columnCount}>
                ({resolvedList.length})
              </span>
            </div>
            <div 
              className={styles.cardList}
              onScroll={(e) => handleScroll(e, 'RESOLVED')}
            >
              {resolvedList.length === 0 ? (
                <div className={styles.empty}>처리완료 신고가 없습니다.</div>
              ) : (
                <>
                  {resolvedList.map((report) => (
                    <div
                      key={report.reportsId}
                      className={styles.card}
                      onClick={() => navigate(`/reports/detail/${report.reportsId}`)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={`${styles.badge} ${getTypeBadgeClass(report.type)}`}>
                          {report.type === "POST" && "게시글"}
                          {report.type === "REPLY" && "댓글"}
                          {report.type === "REVIEW" && "리뷰"}
                        </span>
                        <span className={styles.date}>{String(report.createdAt ?? "").slice(0, 10)}</span>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>신고 사유: {report.reason}</div>
                        <p className={styles.cardContent}>
                          {report.detail?.length > 80 ? report.detail.slice(0, 80) + "..." : report.detail}
                        </p>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.userInfo}>
                          <div className={styles.userItem}>
                            <span className={styles.userIcon}>👤</span>
                            <span className={styles.userName}>{report.memberName || report.memberId}</span>
                          </div>
                          <span className={styles.arrow}>→</span>
                          <div className={styles.userItem}>
                            <span className={styles.userIcon}>🎯</span>
                            <span className={styles.userName}>{report.targetMemberName || report.targetMemberId}</span>
                          </div>
                        </div>
                        {user?.memberId === 1 && (
                          <button 
                            className={styles.statusManageBtn} 
                            onClick={(e) => handleStatusClick(report, e)}
                          >
                            📋 상세 정보
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && <div className={styles.loading}>로딩 중...</div>}
                </>
              )}
            </div>
          </div>

          <div className={styles.kanbanColumn}>
            <div className={`${styles.columnHeader} ${styles.rejected}`}>
              <span className={styles.columnTitle}>🚫 반려</span>
              <span className={styles.columnCount}>
                ({rejectedList.length})
              </span>
            </div>
            <div 
              className={styles.cardList}
              onScroll={(e) => handleScroll(e, 'REJECTED')}
            >
              {rejectedList.length === 0 ? (
                <div className={styles.empty}>반려된 신고가 없습니다.</div>
              ) : (
                <>
                  {rejectedList.map((report) => (
                    <div
                      key={report.reportsId}
                      className={styles.card}
                      onClick={() => navigate(`/reports/detail/${report.reportsId}`)}
                    >
                      <div className={styles.cardHeader}>
                        <span className={`${styles.badge} ${getTypeBadgeClass(report.type)}`}>
                          {report.type === "POST" && "게시글"}
                          {report.type === "REPLY" && "댓글"}
                          {report.type === "REVIEW" && "리뷰"}
                        </span>
                        <span className={styles.date}>{String(report.createdAt ?? "").slice(0, 10)}</span>
                      </div>

                      <div className={styles.cardBody}>
                        <div className={styles.cardTitle}>신고 사유: {report.reason}</div>
                        <p className={styles.cardContent}>
                          {report.detail?.length > 80 ? report.detail.slice(0, 80) + "..." : report.detail}
                        </p>
                      </div>

                      <div className={styles.cardFooter}>
                        <div className={styles.userInfo}>
                          <div className={styles.userItem}>
                            <span className={styles.userIcon}>👤</span>
                            <span className={styles.userName}>{report.memberName || report.memberId}</span>
                          </div>
                          <span className={styles.arrow}>→</span>
                          <div className={styles.userItem}>
                            <span className={styles.userIcon}>🎯</span>
                            <span className={styles.userName}>{report.targetMemberName || report.targetMemberId}</span>
                          </div>
                        </div>
                        {user?.memberId === 1 && (
                          <button 
                            className={styles.statusManageBtn} 
                            onClick={(e) => handleStatusClick(report, e)}
                          >
                            📋 상세 정보
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {loading && <div className={styles.loading}>로딩 중...</div>}
                </>
              )}
            </div>
          </div>
        </div>

        <ReportStatusModal
          isOpen={isStatusModalOpen}
          onClose={() => setIsStatusModalOpen(false)}
          report={selectedReport}
          onSuccess={handleStatusSuccess}
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

export default ReportsPage;