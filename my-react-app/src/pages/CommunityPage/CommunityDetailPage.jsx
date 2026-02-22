import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom"; // useLocation 추가
import { communityApi } from "../../apis/communityApi";
import { reviewApi } from "../../apis/reviewApi";
import CustomModal from "../../components/common/CustomModal";
import Profile from "../../components/common/Profile";
import ReportModal from "../../components/common/ReportModal";
import UserDetailModal from "../../components/common/UserDatailModal";
import CommunityWriteModal from "../../components/community/CommunityWriteModal";

import { getFullUrl2 } from "../../utils/communityImageUtil";
import { useAuth } from "../../context/AuthContext";

import styles from "./CommunityDetailPage.module.css";

function CommunityDetailPage() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation(); // 주소창 정보를 가져오기 위해 추가
  const { user, isAuthenticated } = useAuth();

  // URL 쿼리 스트링에서 targetReply 값을 가져옴 (예: ?targetReply=123)
  const queryParams = new URLSearchParams(location.search);
  const targetReplyId = queryParams.get("targetReply");

  const [post, setPost] = useState(null);
  const [files, setFiles] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [replies, setReplies] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // 작성자 본인 여부 계산
  const isAuthor = isAuthenticated && user?.memberId === post?.memberId;

  const getBadgeClass = (cat) => {
    if (cat === "나눔") return styles.badgeShare;
    if (cat === "자유") return styles.badgeFree;
    if (cat === "인증") return styles.badgeCert;
    if (cat === "정보") return styles.badgeInfo;
    if (cat === "기타") return styles.badgeEtc;
    return styles.badgeDefault;
  };

  const [isLiked, setIsLiked] = useState(false);
  const [likedReplies, setLikedReplies] = useState({});

  const [editModalConfig, setEditModalConfig] = useState({
    isOpen: false,
    replyId: null,
    currentContent: "",
  });
  const [editContent, setEditContent] = useState("");
  const [replyContent, setReplyContent] = useState("");
  const [openReplyBoxId, setOpenReplyBoxId] = useState(null);
  const [replyBoxContent, setReplyBoxContent] = useState({});

  const [modalConfig, setModalConfig] = useState({
    isOpen: false,
    type: "alert",
    message: "",
    onConfirm: () => {},
  });

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState(null);

  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTargetInfo, setReportTargetInfo] = useState({ id: null, name: "", type: "", targetId: null });

  const onReport = async (targetMemberId, targetName, type, targetId) => {
    if (!checkAuth()) return;
    try {
      const data = {
        reviewId: 0,
        postId: type === 'post' ? targetId : 0,
        replyId: type === 'reply' ? targetId : 0
      };
      await reviewApi.reviewCheck(user.memberId, targetMemberId, data);
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

        if(error.response?.status === 403) {
          alert("누적 신고로 인해 블라인드 처리된 게시글입니다.");
          navigate("/community");
        }
      } finally {
        setIsLoading(false);
      }
    };
    if (postId) fetchData();
  }, [postId]);

  useEffect(() => {
    if (!isAuthenticated || !user || !postId) return;
    const fetchLikeStatus = async () => {
      try {
        const likeStatus = await communityApi.getPostLikeStatus(postId, user.memberId);
        setIsLiked(likeStatus === "Y");
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

  const checkAuth = () => {
    if (!isAuthenticated) {
      navigate("/", { state: { openLogin: true } });
      return false;
    }
    return true;
  };

  const handleProfileClick = (memberId) => {
    setSelectedMemberId(memberId);
    setIsUserModalOpen(true);
  };

  const handlePostLike = async () => {
    if (!checkAuth()) return;
    if (isAuthor) return; // 본인 글 방어 로직
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

  const handleReplyLike = async (replyId) => {
    if (!checkAuth()) return;
    const reply = replies.find(r => r.replyId === replyId);
    if (user?.memberId === reply?.memberId) return; // 본인 댓글 방어 로직
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

  const handleReplyEdit = async (replyId) => {
    const replyToEdit = replies.find(r => r.replyId === replyId);
    if (!replyToEdit) return;
    setEditContent(replyToEdit.content);
    setEditModalConfig({ isOpen: true, replyId: replyId, currentContent: replyToEdit.content });
  };

  const handleReplyEditSubmit = async () => {
    if(!editContent.trim()) {
      setModalConfig({ isOpen: true, type: "alert", message: "댓글 내용을 입력해주세요.", onConfirm: () => setModalConfig((prev) => ({ ...prev, isOpen: false })) });
      return;
    }
    try {
      await communityApi.replyUpdate(postId, editModalConfig.replyId, editContent, user.memberId);
      const replyData = await communityApi.replyList(postId);
      setReplies(replyData || []);
      setEditModalConfig({ isOpen: false, replyId: null, currentContent: "" });
      setEditContent("");
    } catch (error) {
      console.error("수정 실패:", error);
    }
  };

  const handleReplyDelete = async (replyId) => {
    setModalConfig({
      isOpen: true,
      type: "confirm",
      message: "댓글을 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await communityApi.replyDelete(postId, replyId, user.memberId);
          const replyData = await communityApi.replyList(postId);
          setReplies(replyData || []);
          setModalConfig({ isOpen: false });
        } catch (error) {
          console.error("삭제 실패:", error);
        }
      },
    });
  };

  const handleReplySubmit = async () => {
    if (!checkAuth()) return;
    if (!replyContent.trim()) return;
    try {
      await communityApi.replyInsert(postId, { memberId: user.memberId, content: replyContent, parentReplyId: 0 });
      const newReplies = await communityApi.replyList(postId);
      setReplies(newReplies);
      setReplyContent("");
    } catch (error) {
      console.error("등록 실패:", error);
    }
  };

  const handleChildReplySubmit = async (parentReplyId) => {
    if (!checkAuth()) return;
    const content = replyBoxContent[parentReplyId] || "";
    if (!content.trim()) return;
    try {
      await communityApi.replyInsert(postId, { memberId: user.memberId, content, parentReplyId });
      const newReplies = await communityApi.replyList(postId);
      setReplies(newReplies);
      setOpenReplyBoxId(null);
      setReplyBoxContent((prev) => ({ ...prev, [parentReplyId]: "" }));
    } catch (error) {
      console.error("답글 실패:", error);
    }
  };

  const toggleReplyBox = (replyId) => {
    if (!checkAuth()) return;
    setOpenReplyBoxId((prev) => (prev === replyId ? null : replyId));
  };

  const handleEdit = () => {
    if (!checkAuth()) return;
    if (!isAuthor) return;
    setIsEditModalOpen(true);
  };

  const handleDelete = async () => {
    if (!checkAuth() || !isAuthor) return;
    setModalConfig({
      isOpen: true,
      type: "confirm",
      message: "정말 삭제하시겠습니까?",
      onConfirm: async () => {
        try {
          await communityApi.communityDelete(postId);
          navigate("/community");
        } catch (error) {
          console.error("삭제 실패:", error);
        }
      },
    });
  };

  const rootReplies = replies.filter((r) => r.depth === 0);
  const getChildReplies = (parentReplyId) => replies.filter((r) => r.parentReplyId === parentReplyId);

  const renderReplies = (parentReplyId) => {
    const children = getChildReplies(parentReplyId);
    if (children.length === 0) return null;

    return children.map((child) => (
      <div key={child.replyId} id={`reply-${child.replyId}`}>
        {/* targetReplyId와 일치하면 highlight 클래스 추가 */}
        <div className={`${styles.replyItemChild} ${String(child.replyId) === targetReplyId ? styles.highlight : ""}`} style={{ '--reply-depth': child.depth }}>
          <div className={styles.replyTop}>
            <div className={styles.replyProfileWrapper}>
              <Profile size="small" memberId={child.memberId} userName={child.name || String(child.memberId)} onClick={handleProfileClick} />
            </div>
            <p className={styles.replyText}>{child.content}</p>
          </div>
          <div className={styles.replyBottom}>
            <div className={styles.replyActions}>
              <button
                className={`${styles.replyLikeBtn} ${likedReplies[child.replyId] ? styles.active : ""}`}
                onClick={() => handleReplyLike(child.replyId)}
                disabled={!isAuthenticated || user?.memberId === child.memberId}
                style={{ cursor: (!isAuthenticated || user?.memberId === child.memberId) ? 'not-allowed' : 'pointer' }}
                title={user?.memberId === child.memberId ? "본인 댓글에는 좋아요를 누를 수 없습니다." : ""}
              >
                {likedReplies[child.replyId] ? "❤️" : "🩶"} {child.likeCount || 0}
              </button>
              {isAuthenticated && user?.memberId !== child.memberId && (
                <button className={styles.replyReportBtn} onClick={() => onReport(child.memberId, child.name, 'reply', child.replyId)}>🚨 신고</button>
              )}
              <button className={`${styles.replyReplyBtn} ${openReplyBoxId === child.replyId ? styles.active : ""}`} onClick={() => toggleReplyBox(child.replyId)}>💬 답글</button>
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

  return (
    <div className={styles.page}>
      <div className={styles.frame}>
        <div className={styles.topActions}>
          <div className={styles.leftBtns}>
            <button
              className={`${styles.postLikeBtn} ${isLiked ? styles.active : ""}`}
              onClick={handlePostLike}
              disabled={!isAuthenticated || isAuthor}
              style={{ cursor: (!isAuthenticated || isAuthor) ? 'not-allowed' : 'pointer' }}
              title={isAuthor ? "본인 글에는 좋아요를 누를 수 없습니다." : ""}
            >
              {isLiked ? "❤️" : "🩶"}
              <span>{post.likeCount}</span>
            </button>
            {isAuthenticated && !isAuthor && (
              <button className={styles.reportBtn} onClick={() => onReport(post.memberId, post.name, 'post', postId)}>🚨 신고</button>
            )}
          </div>
          <div className={styles.rightBtns}>
            {isAuthor && (
              <>
                <button className={styles.editBtn} onClick={handleEdit}>✏️ 수정</button>
                <button className={styles.deleteBtn} onClick={handleDelete}>🗑️ 삭제</button>
              </>
            )}
            <button className={styles.backBtn} onClick={() => navigate("/community")}>← 목록으로</button>
          </div>
        </div>

        <article className={styles.postCard}>
          <header className={styles.postHeader}>
            <div className={styles.headerMeta}>
              <div className={styles.headerTop}>
                <div className={styles.headerRight}>
                  <Profile size="small" memberId={post.memberId} userName={post.name || String(post.memberId)} onClick={handleProfileClick} />
                </div>
                <div className={styles.headerLeft}>
                  <div className={styles.headerRow1}>
                    <span className={`${styles.categoryBadge} ${getBadgeClass(post.category)}`}>{post.category || "기타"}</span>
                  </div>
                  <div className={styles.headerRow2}>
                    <span>작성일 : {String(post.updatedAt || "").slice(0, 10)}</span>
                    <span className={styles.metaDivider}>|</span>
                    <span>조회수 : {post.viewCount}</span>
                  </div>
                </div>
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
                  src={getFullUrl2(`/community/file/${f.changeName}`)}
                  alt="첨부이미지"
                  className={styles.postImg}
                  onClick={() => setSelectedImage(getFullUrl2(`/community/file/${f.changeName}`))}
                  onError={(e) => {
                    console.error("이미지 로드 실패:", f.changeName);
                    e.target.style.display = "none";
                  }}
                />
              ))}
            </div>
          )}
        </article>

        <section className={styles.commentSection}>
          <h3 className={styles.commentTitle}>댓글 <span className={styles.commentCountBadge}>{replies.length}</span></h3>
          <div className={styles.mainReplyInput}>
            <input
              className={styles.replyInput}
              placeholder={isAuthenticated ? "댓글을 남겨보세요." : "로그인 후 댓글을 작성할 수 있습니다."}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              onFocus={() => !isAuthenticated && checkAuth()}
              onKeyDown={(e) => e.key === "Enter" && handleReplySubmit()}
              disabled={!isAuthenticated}
            />
            <button className={styles.replySubmitBtn} onClick={handleReplySubmit}>등록</button>
          </div>

          <div className={styles.replyList}>
            {rootReplies.map((r) => (
              <div key={r.replyId} id={`reply-${r.replyId}`}>
                {/* targetReplyId와 일치하면 highlight 클래스 추가 */}
                <div className={`${styles.replyItem} ${String(r.replyId) === targetReplyId ? styles.highlight : ""}`}>
                  <div className={styles.replyTop}>
                    <div className={styles.replyProfileWrapper}>
                      <Profile size="small" memberId={r.memberId} userName={r.name || String(r.memberId)} onClick={handleProfileClick} />
                    </div>
                    <p className={styles.replyText}>{r.content}</p>
                  </div>
                  <div className={styles.replyBottom}>
                    <div className={styles.replyActions}>
                      <button
                        className={`${styles.replyLikeBtn} ${likedReplies[r.replyId] ? styles.active : ""}`}
                        onClick={() => handleReplyLike(r.replyId)}
                        disabled={!isAuthenticated || user?.memberId === r.memberId}
                        style={{ cursor: (!isAuthenticated || user?.memberId === r.memberId) ? 'not-allowed' : 'pointer' }}
                        title={user?.memberId === r.memberId ? "본인 댓글에는 좋아요를 누를 수 없습니다." : ""}
                      >
                        {likedReplies[r.replyId] ? "❤️" : "🩶"} {r.likeCount || 0}
                      </button>
                      {isAuthenticated && user?.memberId !== r.memberId && (
                        <button className={styles.replyReportBtn} onClick={() => onReport(r.memberId, r.name, 'reply', r.replyId)}>🚨 신고</button>
                      )}
                      <button className={`${styles.replyReplyBtn} ${openReplyBoxId === r.replyId ? styles.active : ""}`} onClick={() => toggleReplyBox(r.replyId)}>💬 답글</button>
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
                {renderReplies(r.replyId)}
              </div>
            ))}
          </div>
        </section>

        <CustomModal isOpen={modalConfig.isOpen} type={modalConfig.type} message={modalConfig.message} onConfirm={modalConfig.onConfirm} onCancel={() => setModalConfig(prev => ({ ...prev, isOpen: false }))} zIndex={15000} />
        <UserDetailModal isOpen={isUserModalOpen} onClose={() => setIsUserModalOpen(false)} memberId={selectedMemberId} zIndex={20000} />
        <ReportModal isOpen={isReportModalOpen} onClose={() => setIsReportModalOpen(false)} reporterId={user?.memberId} reporterName={user?.name} targetName={reportTargetInfo.name} targetId={reportTargetInfo.id} onSubmit={handleReportSubmit} />
        {selectedImage && (
          <div className={styles.imageOverlay} onClick={() => setSelectedImage(null)}>
            <img src={selectedImage} alt="크게" className={styles.imageOverlayImg} onClick={(e) => e.stopPropagation()} />
            <button className={styles.imageOverlayClose} onClick={() => setSelectedImage(null)}>x</button>
          </div>
        )}
        <CommunityWriteModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} postId={postId} onSuccess={(msg) => window.location.reload()} />
        
        {/* 댓글 수정 간이 모달 */}
        {editModalConfig.isOpen && (
          <div className={styles.replyEditModalOverlay}>
            <div className={styles.replyEditModalContent}>
              <h3>댓글 수정</h3>
              <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} className={styles.replyEditTextarea} />
              <div className={styles.replyEditBtns}>
                <button onClick={() => setEditModalConfig({ isOpen: false, replyId: null, currentContent: "" })}>취소</button>
                <button onClick={handleReplyEditSubmit} className={styles.replyEditSubmitBtn}>수정</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityDetailPage;