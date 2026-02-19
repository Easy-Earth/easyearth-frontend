import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { communityApi } from "../../apis/communityApi";
import { reviewApi } from "../../apis/reviewApi";
import CustomModal from "../../components/common/CustomModal";
import Profile from "../../components/common/Profile";
import ReportModal from "../../components/common/ReportModal";
import UserDetailModal from "../../components/common/UserDatailModal";
import CommunityWriteModal from "../../components/community/CommunityWriteModal";
import { useAuth } from "../../context/AuthContext";
import { getFullUrl } from "../../utils/imageUtil";
import styles from "./CommunityDetailPage.module.css";
function CommunityDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const [post, setPost] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loginUser = JSON.parse(localStorage.getItem("user"));
  const currentMemberId = loginUser ? loginUser.memberId : null;
  const currentMemberName = loginUser ? loginUser.name : null;

  const getBadgeClass = (cat) => {
    if (cat === "나눔") return styles.badgeShare;
    if (cat === "자유") return styles.badgeFree;
    if (cat === "인증") return styles.badgeCert;
    if (cat === "정보") return styles.badgeInfo;
    if (cat === "기타") return styles.badgeEtc;
    return styles.badgeDefault;
  };
  console.log('currentMemberId : ' + currentMemberId);
  console.log('loginMemberId : ' + loginUser);
  console.log('user : ' + user);
  // console.log('로그인 한 사람이 게시글 쓴 사람이랑 같나 ? : ' + isAuthor);
  // 게시글 좋아요
  const [isLiked, setIsLiked] = useState(false);

  // 댓글 좋아요 (replyId → boolean)
  const [likedReplies, setLikedReplies] = useState({});

  // 댓글 수정 모달
  const [editModalConfig, setEditModalConfig] = useState({
    isOpen: false,
    replyId: null,
    currentContent: "",
  });
  const [editContent, setEditContent] = useState("");

  // 메인 댓글 입력
  const [replyContent, setReplyContent] = useState("");

  // 답글 입력창: 열려있는 replyId (null이면 닫힘)
  const [openReplyBoxId, setOpenReplyBoxId] = useState(null);

  // 답글 내용 (replyId → string)
  const [replyBoxContent, setReplyBoxContent] = useState({});

  // CustomModal 설정
  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: () => {},
  });

  // 수정 모달
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 멤버 상세조회 모달
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetId, setReportTargetId] = useState(null);
  const [selectedReportReviewId, setSelectedReportReviewId] = useState(null); 

const [reportTargetInfo, setReportTargetInfo] = useState({ id: null, name: "", type: "", targetId: null });

// ── 신고 버튼 클릭 시 중복 체크 ──
const onReport = async (targetMemberId, targetName, type, targetId) => {
  if (!checkAuth()) return;

  try {
    const data = {
      reviewId: 0,
      postId: type === 'post' ? targetId : 0,
      replyId: type === 'reply' ? targetId : 0
    };

    // reviewApi를 사용하여 신고 내역이 있는지 확인
    await reviewApi.reviewCheck(user.memberId, targetMemberId, data);
    
    // 내역이 없으면 모달 정보 세팅
    setReportTargetInfo({ id: targetMemberId, name: targetName, type: type, targetId: targetId });
    setIsReportModalOpen(true);
  } catch (err) {
    const serverErrorMessage = err.response?.data || "이미 신고한 내역이 존재합니다.";
    setModalConfig({
      isOpen: true,
      type: 'alert',
      message: serverErrorMessage,
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  }
};

// ── 신고 모달에서 '제출' 클릭 시 ──
const handleReportSubmit = async (reportData) => {
  try {
    const data = {
      memberId: user.memberId,
      targetMemberId: reportData.targetId,
      postId: reportTargetInfo.type === "post" ? reportTargetInfo.targetId : 0,
      replyId: reportTargetInfo.type === "reply" ? reportTargetInfo.targetId : 0,
      reviewId: 0,
      type: reportTargetInfo.type === "post" ? "POST" : "REPLY",
      reason: reportData.reportTag,
      detail: reportData.details
    };

    await reviewApi.reviewReport(data);

    setModalConfig({
      isOpen: true,
      type: 'alert',
      message: '신고가 정상적으로 접수되었습니다.',
      onConfirm: () => setModalConfig(prev => ({ ...prev, isOpen: false }))
    });
  } catch (error) {
    console.error("신고 실패:", error);
    alert(error.response?.data || "신고 처리 중 오류가 발생했습니다.");
  }
  setIsReportModalOpen(false);
};
  /* ── 데이터 로드 ── */
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const data = await communityApi.communityDetail(postId);
        if (data) {
          setPost(data.cp || data);
          setFiles(data.fileList || []);
        }
        const replyData = await communityApi.replyList(postId);
        setReplies(replyData || []);
      } catch (error) {
        console.error("데이터 로드 실패:", error);
      } finally {
        setIsLoading(false);
      }
    };
    if (postId) fetchData();
  }, [postId]);

  /* ── 좋아요 상태 초기화 ── */
  useEffect(() => {
    if (!isAuthenticated || !user || !postId) return;

    const fetchLikeStatus = async () => {
      try {
        // 게시글 좋아요 상태
        const likeStatus = await communityApi.getPostLikeStatus(postId, user.memberId);
        setIsLiked(likeStatus === "Y");

        // 댓글 좋아요 상태
        const replyData = await communityApi.replyList(postId);
        if (replyData) {
          const likedMap = {};
          await Promise.all(
            replyData.map(async (reply) => {
              const status = await communityApi.getReplyLikeStatus(postId, reply.replyId, user.memberId);
              likedMap[reply.replyId] = status === "Y";
            })
          );
          setLikedReplies(likedMap);
        }
      } catch (error) {
        console.error("좋아요 상태 로드 실패:", error);
      }
    };
    fetchLikeStatus();
  }, [postId, isAuthenticated, user]);

  /* ── 로그인 체크 공통 ── */
  const checkAuth = () => {
    if (!isAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return false;
    }
    return true;
  };

    /* ── 멤버 상세조회 ── */
  const handleProfileClick = (memberId) => {
    setSelectedMemberId(memberId);
    setIsUserModalOpen(true);
  };

  /* ── 게시글 좋아요 토글 ── */
  const handlePostLike = async () => {
    if (!checkAuth()) return;
    try {
      const response = await communityApi.communityLikes(postId, user.memberId);
      const newLiked = response === "좋아요 등록";
      setIsLiked(newLiked);
      setPost((prev) => ({
        ...prev,
        likeCount: newLiked ? prev.likeCount + 1 : prev.likeCount - 1,
      }));
    } catch (error) {
      console.error("좋아요 처리 실패:", error);
    }
  };

  /* ── 댓글 좋아요 토글 ── */
  const handleReplyLike = async (replyId) => {
    if (!checkAuth()) return;
    try {
      const response = await communityApi.replyLikes(postId, replyId, user.memberId);
      const newLiked = response === "댓글 좋아요 등록";
      setLikedReplies((prev) => ({ ...prev, [replyId]: newLiked }));
      setReplies((prev) => 
        prev.map((r) => 
          r.replyId === replyId
            ? { ...r, likeCount: newLiked ? r.likeCount + 1 : r.likeCount - 1 }
            : r
        )
      );
    } catch (error) {
      console.error("댓글 좋아요 실패 : ", error);
    }
  };

  /* ── 댓글 수정 ── */
  const handleReplyEdit = async (replyId) => {
    // 수정할 댓글 찾기
    const replyToEdit = replies.find(r => r.replyId === replyId);
    if (!replyToEdit) return;
    
    setEditContent(replyToEdit.content);
    setEditModalConfig({
      isOpen: true,
      replyId: replyId,
      currentContent: replyToEdit.content,
    });
  };

  /* ── 댓글 수정 제출 ── */
  const handleReplyEditSubmit = async () => {
    if(!editContent.trim()) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        message: "댓글 내용을 입력해주세요.",
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    if(editContent === editModalConfig.currentContent) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        message: "변경된 내용이 없습니다.",
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    try {
      await communityApi.replyUpdate(postId, editModalConfig.replyId, editContent, user.memberId);
      const replyData = await communityApi.replyList(postId);
      setReplies(replyData || []);
      setEditModalConfig({ isOpen: false, replyId: null, currentContent: "" });
      setEditContent("");
      setModalConfig({
        isOpen: true,
        type: "alert",
        message: "댓글이 수정되었습니다.",
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
    } catch (error) {
      console.error("댓글 수정 실패: ", error);
      setModalConfig({
        isOpen: true,
        type: "alert",
        message: "댓글 수정에 실패했습니다.",
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
    }
  };

  /* ── 댓글 삭제 ── */
  const handleReplyDelete = async (replyId) => {
    setModalConfig({
      isOpen: true,
      type: "confirm",
      message: "댓글을 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          console.log("삭제할 replyId: ", replyId);
          await communityApi.replyDelete(postId, replyId, user.memberId);
          const replyData = await communityApi.replyList(postId);
          setReplies(replyData || []);
          setModalConfig({
            isOpen: true,
            type: "alert",
            message: "댓글이 삭제되었습니다.",
            onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
          });
        } catch (error) {
          console.error("댓글 삭제 실패:", error);
          setModalConfig({
            isOpen: true,
            type: "alert",
            message: "댓글 삭제에 실패했습니다.",
            onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  /* ── 메인 댓글 등록 ── */
  const handleReplySubmit = async () => {
    if (!checkAuth()) return;
    if (!replyContent.trim()) return;
    try {
      await communityApi.replyInsert(postId, {
        memberId: user.memberId,
        content: replyContent,
        parentReplyId: 0,
      });
      const newReplies = await communityApi.replyList(postId);
      setReplies(newReplies);
      setReplyContent("");
    } catch (error) {
      console.error("댓글 등록 실패:", error);
    }
  };

  /* ── 답글(대댓글) 등록 ── */
  const handleChildReplySubmit = async (parentReplyId) => {
    if (!checkAuth()) return;
    const content = replyBoxContent[parentReplyId] || "";
    if (!content.trim()) return;
    try {
      await communityApi.replyInsert(postId, {
        memberId: user.memberId,
        content,
        parentReplyId,
      });
      const newReplies = await communityApi.replyList(postId);
      setReplies(newReplies);
      setOpenReplyBoxId(null);
      setReplyBoxContent((prev) => ({ ...prev, [parentReplyId]: "" }));
    } catch (error) {
      console.error("답글 등록 실패:", error);
    }
  };

  /* ── 답글 입력창 토글 ── */
  const toggleReplyBox = (replyId) => {
    if (!checkAuth()) return;
    setOpenReplyBoxId((prev) => (prev === replyId ? null : replyId));
  };

  /* ── 게시글 수정 ── */
  const handleEdit = () => {
    if (!checkAuth()) return;
    if (user?.memberId !== post.memberId) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        message: "작성자만 수정할 수 있습니다.",
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = (message) => {
    setModalConfig({
      isOpen: true,
      type: "alert",
      message: message || "게시글이 수정되었습니다.",
      onConfirm: () => {
        setModalConfig((prev) => ({ ...prev, isOpen: false }));
        window.location.reload();
      },
    });
  };

  /* ── 게시글 삭제 ── */
  const handleDelete = async () => {
    if (!checkAuth()) return;
    if (user.memberId !== post.memberId) {
      setModalConfig({
        isOpen: true,
        type: "alert",
        message: "작성자만 삭제할 수 있습니다.",
        onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
      });
      return;
    }

    // 삭제 확인 모달
    setModalConfig({
      isOpen: true,
      type: "confirm",
      message: "정말 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await communityApi.communityDelete(postId);
          setModalConfig({
            isOpen: true,
            type: "alert",
            message: "게시글이 삭제되었습니다.",
            onConfirm: () => {
              setModalConfig((prev) => ({ ...prev, isOpen: false }));
              navigate("/community");
            },
          });
        } catch (error) {
          console.error("삭제 실패:", error);
          setModalConfig({
            isOpen: true,
            type: "alert",
            message: "삭제 중 오류가 발생했습니다.",
            onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })),
          });
        }
      },
    });
  };

  /* ── depth 0 댓글 목록 ── */
  const rootReplies = replies.filter((r) => r.depth === 0);

  /* ── 특정 댓글의 대댓글 목록 ── */
  const getChildReplies = (parentReplyId) =>
    replies.filter((r) => r.parentReplyId === parentReplyId);

  const renderReplies = (parentReplyId) => {
    const children = getChildReplies(parentReplyId);
    if (children.length === 0) return null;

    return children.map((child) => (
      <div key={child.replyId}>
        <div className={styles.replyItemChild} style={{ '--reply-depth': child.depth }}>
          <div className={styles.replyTop}>
            <div className={styles.replyProfileWrapper}>
              <Profile
                size="small"
                memberId={child.memberId}
                userName={child.name || String(child.memberId)}
                onClick={handleProfileClick}
              />
            </div>
            <p className={styles.replyText}>{child.content}</p>
          </div>
          <div className={styles.replyBottom}>
            <div className={styles.replyActions}>
              <button
                className={`${styles.replyLikeBtn} ${likedReplies[child.replyId] ? styles.active : ""}`}
                onClick={() => handleReplyLike(child.replyId)}
              >
                {likedReplies[child.replyId] ? "❤️" : "🩶"} {child.likeCount || 0}
              </button>
              {isAuthenticated && !isAuthor && (
                <button 
                  className={styles.reportBtn} 
                  onClick={() => onReport(post.memberId, post.name, 'post', postId)}
                >
                  🚨 신고
                </button>
              )}
              <button
                className={`${styles.replyReplyBtn} ${openReplyBoxId === child.replyId ? styles.active : ""}`}
                onClick={() => toggleReplyBox(child.replyId)}
              >
                💬 답글
              </button>
              {isAuthenticated && user?.memberId === child.memberId && (
                <>
                  <button className={styles.replyEditBtn} onClick={() => handleReplyEdit(child.replyId)}>✏️ 수정</button>
                  <button className={styles.replyDeleteBtn} onClick={() => handleReplyDelete(child.replyId)}>🗑️ 삭제</button>
                </>
              )}
            </div>
            <span className={styles.replyDate}>{String(child.updatedAt || "").slice(0, 10)}</span>
          </div>
        </div>

        {openReplyBoxId === child.replyId && (
          <div className={styles.inlineReplyBox}>
            <input
              className={styles.inlineReplyInput}
              placeholder="답글을 입력하세요..."
              value={replyBoxContent[child.replyId] || ""}
              onChange={(e) => setReplyBoxContent((prev) => ({ ...prev, [child.replyId]: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleChildReplySubmit(child.replyId)}
              autoFocus
            />
            <button className={styles.inlineSubmitBtn} onClick={() => handleChildReplySubmit(child.replyId)}>등록</button>
            <button className={styles.inlineCancelBtn} onClick={() => setOpenReplyBoxId(null)}>취소</button>
          </div>
        )}

        {renderReplies(child.replyId)}
      </div>
    ));
  };

  if (isLoading) return <div className={styles.loading}>로딩 중...</div>;
  if (!post) return <div className={styles.error}>게시글을 찾을 수 없습니다.</div>;

  // 작성자 본인 여부
  const isAuthor = isAuthenticated && user?.memberId === post.memberId;
  
  // 디버깅용 (나중에 제거)
  console.log("🔍 권한 체크:", {
    isAuthenticated,
    userMemberId: user?.memberId,
    postMemberId: post.memberId,
    isAuthor
  });

  return (
    <div className={styles.page}>
      <div className={styles.frame}>

        {/* ── 상단 액션바 ── */}
        <div className={styles.topActions}>
          <div className={styles.leftBtns}>
            {/* 게시글 좋아요 */}
            <button
              className={`${styles.postLikeBtn} ${isLiked ? styles.active : ""}`}
              onClick={handlePostLike}
            >
              {isLiked ? "❤️" : "🩶"}
              <span>{post.likeCount}</span>
            </button>
            {/* 게시글 신고 */}
            {isAuthenticated && !isAuthor && (
              <button 
                className={styles.reportBtn} 
                onClick={() => onReport(post.memberId, post.name, 'post', postId)}
              >
                🚨 신고
              </button>
            )}
          </div>
          <div className={styles.rightBtns}>
            {/* 작성자만 수정/삭제 버튼 보임 */}
            {isAuthor && (
              <>
                <button className={styles.editBtn} onClick={handleEdit}>
                  ✏️ 수정
                </button>
                <button className={styles.deleteBtn} onClick={handleDelete}>
                  🗑️ 삭제
                </button>
              </>
            )}
            <button className={styles.backBtn} onClick={() => navigate("/community")}>
              ← 목록으로
            </button>
          </div>
        </div>

        {/* ── 게시글 카드 ── */}
        <article className={styles.postCard}>
          <header className={styles.postHeader}>
            <div className={styles.headerMeta}>
              <div className={styles.headerTop}>
                {/* 왼쪽: 카테고리 + 작성일/조회수 */}
                <div className={styles.headerRight}>
                  <Profile
                    size="small"
                    memberId={post.memberId}
                    userName={post.name || String(post.memberId)}
                    onClick={handleProfileClick}
                  />
                </div>
                <div className={styles.headerLeft}>
                  <div className={styles.headerRow1}>
                    <span className={`${styles.categoryBadge} ${getBadgeClass(post.category)}`}>
                      {post.category || "기타"}
                    </span>
                  </div>
                  <div className={styles.headerRow2}>
                    <span>작성일 : {String(post.updatedAt || "").slice(0, 10)}</span>
                    <span className={styles.metaDivider}>|</span>
                    <span>조회수 : {post.viewCount}</span>
                  </div>
                </div>

                {/* 오른쪽: Profile */}
                
              </div>
            </div>
            <h1 className={styles.postMainTitle}>{post.title}</h1>
          </header>

          <div className={styles.postContent}>{post.content}</div>

          {files.length > 0 && (
            <div className={styles.imageGrid}>
              {files.map((f) => (
                <img
                  key={f.filesId}
                  src={getFullUrl(`/community/file/${f.changeName}`)}
                  alt="첨부이미지"
                  className={styles.postImg}
                  onClick={() => setSelectedImage(getFullUrl(`/community/file/${f.changeName}`))}
                  onError={(e) => {
                    console.error("이미지 로드 실패:", f.changeName);
                    e.target.style.display = "none";
                  }}
                />
              ))}
            </div>
          )}
        </article>

        {/* ── 댓글 섹션 ── */}
        <section className={styles.commentSection}>
          <h3 className={styles.commentTitle}>
            댓글
            <span className={styles.commentCountBadge}>{replies.length}</span>
          </h3>

          {/* 메인 댓글 입력 */}
          <div className={styles.mainReplyInput}>
            <input
              className={styles.replyInput}
              placeholder={
                isAuthenticated
                  ? "댓글을 남겨보세요."
                  : "로그인 후 댓글을 작성할 수 있습니다."
              }
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onFocus={() => !isAuthenticated && checkAuth()}
              onKeyDown={(e) => e.key === "Enter" && handleReplySubmit()}
              disabled={!isAuthenticated}
            />
            <button className={styles.replySubmitBtn} onClick={handleReplySubmit}>
              등록
            </button>
          </div>

          {/* 댓글 목록 */}
          <div className={styles.replyList}>
            {rootReplies.map((r) => (
              <div key={r.replyId}>
                {/* depth 0 댓글 */}
                <div className={styles.replyItem}>
                  <div className={styles.replyTop}>
                    <div className={styles.replyProfileWrapper}>
                      <Profile
                        size="small"
                        memberId={r.memberId}
                        userName={r.name || String(r.memberId)}
                        onClick={handleProfileClick}
                      />
                    </div>
                    <p className={styles.replyText}>{r.content}</p>
                  </div>
                  <div className={styles.replyBottom}>
                    <div className={styles.replyActions}>
                      <button
                        className={`${styles.replyLikeBtn} ${likedReplies[r.replyId] ? styles.active : ""}`}
                        onClick={() => handleReplyLike(r.replyId)}
                      >
                        {likedReplies[r.replyId] ? "❤️" : "🩶"} {r.likeCount || 0}
                      </button>
                      {isAuthenticated && user?.memberId !== r.memberId && (
                      <button 
                        className={styles.replyReportBtn} 
                        onClick={() => onReport(r.memberId, r.name, 'reply', r.replyId)}
                      >
                        🚨 신고
                      </button>
                    )}
                      <button
                        className={`${styles.replyReplyBtn} ${openReplyBoxId === r.replyId ? styles.active : ""}`}
                        onClick={() => toggleReplyBox(r.replyId)}
                      >
                        💬 답글
                      </button>
                      {isAuthenticated && user?.memberId === r.memberId && (
                        <>
                          <button className={styles.replyEditBtn} onClick={() => handleReplyEdit(r.replyId)}>✏️ 수정</button>
                          <button className={styles.replyDeleteBtn} onClick={() => handleReplyDelete(r.replyId)}>🗑️ 삭제</button>
                        </>
                      )}
                    </div>
                    <span className={styles.replyDate}>{String(r.updatedAt || "").slice(0, 10)}</span>
                  </div>
                </div>

                {openReplyBoxId === r.replyId && (
                  <div className={styles.inlineReplyBox}>
                    <input
                      className={styles.inlineReplyInput}
                      placeholder="답글을 입력하세요..."
                      value={replyBoxContent[r.replyId] || ""}
                      onChange={(e) => setReplyBoxContent((prev) => ({ ...prev, [r.replyId]: e.target.value }))}
                      onKeyDown={(e) => e.key === "Enter" && handleChildReplySubmit(r.replyId)}
                      autoFocus
                    />
                    <button className={styles.inlineSubmitBtn} onClick={() => handleChildReplySubmit(r.replyId)}>등록</button>
                    <button className={styles.inlineCancelBtn} onClick={() => setOpenReplyBoxId(null)}>취소</button>
                  </div>
                )}

                {/* 재귀 대댓글 렌더링 */}
                {renderReplies(r.replyId)}
              </div>
            ))}
          </div>
        </section>

        {/* CustomModal */}
        <CustomModal
          isOpen={modalConfig.isOpen}
          type={modalConfig.type}
          message={modalConfig.message}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig((prev) => ({ ...prev, isOpen: false }))}
          zIndex={15000}
        />

        {/* 멤버 상세조회 모달 */}
        <UserDetailModal
          isOpen={isUserModalOpen}
          onClose={() => setIsUserModalOpen(false)}
          memberId={selectedMemberId}
          zIndex={20000}
        />
        <ReportModal 
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reporterId={user?.memberId}
          reporterName={user?.name} 
          targetName={reportTargetInfo.name}
          targetId={reportTargetInfo.id} 
          onSubmit={handleReportSubmit}
        />

        {/* 이미지 크게 보기 */}
        {selectedImage && (
          <div className={styles.imageOverlay} onClick={() => setSelectedImage(null)}>
            <img
              src={selectedImage}
              alt="크게 보기"
              className={styles.imageOverlayImg}
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className={styles.imageOverlayClose}
              onClick={() => setSelectedImage(null)}
            >
              x
            </button>
          </div>
        )}

        {/* 게시글 수정 모달 */}
        <CommunityWriteModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          postId={postId}
          onSuccess={handleEditSuccess}
        />

        {/* 댓글 수정 모달 */}
        {editModalConfig.isOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
          }}>
            <div style={{
              background: 'white',
              borderRadius: '16px',
              padding: '24px',
              width: '90%',
              maxWidth: '500px',
            }}>
              <h3 style={{ marginBottom: '16px', fontSize: '18px', fontWeight: '700' }}>
                댓글 수정
              </h3>
              <textarea
                value={editContent}
                onChange={(e) => setEditContent(e.target.value)}
                style={{
                  width: '100%',
                  minHeight: '100px',
                  padding: '12px',
                  backgroundColor: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '15px',
                  marginBottom: '16px',
                  resize: 'none',
                }}
                placeholder="댓글 내용을 입력하세요"
              />
              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => {
                    setEditModalConfig({ isOpen: false, replyId: null, currentContent: "" });
                    setEditContent("");
                  }}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#f1f5f9',
                    color: '#64748b',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  취소
                </button>
                <button
                  onClick={handleReplyEditSubmit}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '8px',
                    border: 'none',
                    background: '#14b8a6',
                    color: 'white',
                    fontWeight: '600',
                    cursor: 'pointer',
                  }}
                >
                  수정
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )}

export default CommunityDetailPage;