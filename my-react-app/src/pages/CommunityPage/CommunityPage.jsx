import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { communityApi } from "../../apis/communityApi.js";
import Button from "../../components/common/Button.jsx";
import CustomModal from "../../components/common/CustomModal.jsx";
import Input from "../../components/common/Input.jsx";
import CommunityWriteModal from "../../components/community/CommunityWriteModal.jsx";
import Pagination from "../../components/pagination/Pagination.jsx";
import { useAuth } from "../../context/AuthContext";

import styles from "./CommunityPage.module.css";

const CommunityPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  const [list, setList] = useState([]);
  const [pageInfo, setPageInfo] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState("title");
  const [keyword, setKeyword] = useState("");
  const PAGE_SIZE = 10;

  // 글쓰기 모달
  const [isWriteModalOpen, setIsWriteModalOpen] = useState(false);

  // 1. ShopPage와 동일한 방식의 CustomModal 설정 (통합 관리)
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: () => {},
  });

  const tabs = useMemo(() => [
    { label: "전체", value: "" },
    { label: "나눔", value: "나눔" },
    { label: "자유", value: "자유" },
    { label: "인증", value: "인증" },
    { label: "정보", value: "정보" },
    { label: "기타", value: "기타" },
  ], []);

  const loadCommunityList = async (page = 1) => {
    setLoading(true);
    setError("");
    const targetPage = typeof page === "number" ? page : 1;

    try {
      const params = { page: targetPage, size: PAGE_SIZE };
      if (category) params.category = category;
      if (keyword.trim()) {
        params.condition = condition;
        params.keyword = keyword.trim();
      }

      const data = await communityApi.communityList(params);

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
      setError("게시글 목록을 불러오지 못했습니다.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadCommunityList(1);
  }, [category]);

  const getBadgeClass = (cat) => {
    if (cat === "나눔") return styles.badgeShare;
    if (cat === "자유") return styles.badgeFree;
    if (cat === "인증") return styles.badgeCert;
    if (cat === "정보") return styles.badgeInfo;
    if (cat === "기타") return styles.badgeEtc;
    return styles.badgeDefault;
  };

  // 2. 글쓰기 클릭 핸들러 수정
const handleWriteClick = () => {
    if (!isAuthenticated) {
      // 1. 리다이렉트나 로그인 모달 호출 없이 알림창만 띄움
      setModalConfig({
        isOpen: true,
        type: "alert",
        message: "로그인이 필요한 서비스입니다.",
        onConfirm: () => {
          // 2. 확인을 누르면 그냥 모달만 닫고 현재 자리에 유지
          setModalConfig((prev) => ({ ...prev, isOpen: false }));
        },
      });
      return;
    }
    // 로그인 된 상태일 때만 글쓰기 모달 오픈
    setIsWriteModalOpen(true);
  };

  const handleWriteSuccess = (message) => {
    setModalConfig({
      isOpen: true,
      type: "alert",
      message: message || "게시글이 등록되었습니다.",
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        loadCommunityList(1);
      },
    });
  };

  return (
    <div className={styles.page}>
      <div className={styles.frame}>

        {/* 타이틀 */}
        <div className={styles.titleArea}>
          <h1 className={styles.title}>🌍 에코 커뮤니티</h1>
        </div>

        {/* 탭 + 글쓰기 버튼 */}
        <div className={styles.topRow}>
          <div className={styles.tabs}>
            {tabs.map((t) => (
              <button
                key={t.value || "ALL"}
                type="button"
                className={`${styles.tab} ${category === t.value ? styles.tabActive : ""}`}
                onClick={() => setCategory(t.value)}
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
            <span style={{ fontWeight: 900, color: "#fff" }}>✏️ 글 쓰기</span>
          </Button>
        </div>

        {/* 게시글 수 */}
        <p className={styles.listMeta}>
          총 <em>{pageInfo.listCount ?? 0}</em>개의 게시글
        </p>

        {error && <div className={styles.errorBox}>{error}</div>}

        {/* 카드 목록 */}
        <div className={styles.cardContainer}>
          {loading ? (
            <div className={styles.empty}>로딩 중...</div>
          ) : list.length === 0 ? (
            <div className={styles.empty}>게시글이 없습니다.</div>
          ) : (
            list.map((post) => (
              <div
                key={post.postId}
                className={styles.card}
                onClick={() => navigate(`/community/detail/${post.postId}`)}
              >
                <div className={styles.cardHeader}>
                  <span className={`${styles.badge} ${getBadgeClass(post.category)}`}>
                    {post.category || "기타"}
                  </span>
                  <span className={styles.writer}>{post.name}</span>
                  <span className={styles.dot}>•</span>
                  <span className={styles.date}>
                    {String(post.createdAt ?? "").slice(0, 10)}
                  </span>
                </div>

                <div className={styles.cardBody}>
                  <div className={styles.cardBodyText}>
                    <h2 className={styles.postTitle}>{post.title}
                      {post.hasFiles === 1 && (
                        <span className={styles.fileIcon} title="첨부파일 있음">
                          🖼️
                        </span>
                      )}
                    </h2>
                    <p className={styles.postPreview}>
                      {post.content?.length > 100 ? post.content.slice(0, 100) + "..." : post.content}
                    </p>
                  </div>
                </div>

                <div className={styles.cardFooter}>
                  <div className={styles.statItem}>👁️‍🗨️ {post.viewCount}</div>
                  <div className={styles.statItem}>♥️ {post.likeCount}</div>
                  <div className={styles.statItem}>💬 {post.commentCount}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 페이지네이션 */}
        <Pagination
          pageInfo={pageInfo}
          onChangePage={loadCommunityList}
          disabled={loading}
        />

        {/* 검색 */}
        <form
          className={styles.searchWrap}
          onSubmit={(e) => {
            e.preventDefault();
            loadCommunityList(1);
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

        {/* 글쓰기 모달 */}
        <CommunityWriteModal
          isOpen={isWriteModalOpen}
          onClose={() => setIsWriteModalOpen(false)}
          onSuccess={handleWriteSuccess}
        />

        {/* 3. 통합된 CustomModal (Alert/Confirm 겸용) */}
        <CustomModal
          isOpen={modalConfig.isOpen}
          type={modalConfig.type}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
        />

      </div>
    </div>
  );
};

export default CommunityPage;