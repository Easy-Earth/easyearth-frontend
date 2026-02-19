import React, { useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext'; // ✨ Import
import { createChatRoom, toggleFavorite, acceptInvitation, rejectInvitation, uploadFile, updateProfile } from '../../apis/chatApi';
import { getFullUrl } from '../../utils/imageUtil'; // Import utility
import ChatRoomTypeModal from './ChatRoomTypeModal';
import CustomModal from '../common/CustomModal'; // Use Common CustomModal
import styles from './ChatRoomList.module.css';

const ChatRoomList = () => {
    const { chatRooms, loadChatRooms, connected } = useChat();
    const { user, updateUser } = useAuth();
    const { markNotificationsAsReadForRoom } = useNotification(); // ✨ Destructure
    const navigate = useNavigate();
    const { roomId } = useParams();
    const [showTypeModal, setShowTypeModal] = useState(false);
    const fileInputRef = useRef(null);

    // ✨ 모달 설정 (CustomModal 사용)
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "alert", // 'alert' | 'confirm'
        onConfirm: null,
        onCancel: null
    });

    const closeModal = () => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
    };

    const showAlert = (message, title = "알림", onConfirmCallback = null) => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type: "alert",
            onConfirm: () => {
                closeModal();
                if (onConfirmCallback) onConfirmCallback();
            },
            onCancel: closeModal
        });
    };

    const showConfirm = (message, onConfirm, title = "확인") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type: "confirm",
            onConfirm: () => {
                onConfirm();
                closeModal();
            },
            onCancel: closeModal
        });
    };

    // 프로필 이미지 변경 핸들러
    const handleProfileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            // 1. 파일 업로드
            const fileUrl = await uploadFile(file);
            // 2. 프로필 업데이트
            await updateProfile(user.memberId, fileUrl);
            
            showAlert("프로필 이미지가 변경되었습니다.", "알림", () => {
                if (updateUser) {
                    updateUser({ profileImageUrl: fileUrl });
                }
                loadChatRooms(); // 채팅 목록의 내 프사도 갱신
            });
        } catch (error) {
            console.error("프로필 변경 실패", error);
            showAlert("프로필 이미지 변경에 실패했습니다.");
        }
    };

    const handleProfileClick = () => {
        fileInputRef.current.click();
    };

    // 즐겨찾기 토글
    const handleToggleFavorite = async (chatRoomId, e) => {
        e.stopPropagation(); // 채팅방 열리는 것 방지
        try {
            await toggleFavorite(chatRoomId, user.memberId);
            loadChatRooms(); // 목록 새로고침
        } catch (error) {
            console.error("즐겨찾기 토글 실패", error);
            showAlert("즐겨찾기 설정에 실패했습니다.");
        }
    };

    // 초대 수락
    const handleAcceptInvitation = async (chatRoomId, e) => {
        e.stopPropagation();
        try {
            await acceptInvitation(chatRoomId, user.memberId);
            loadChatRooms(); // 목록 새로고침
            markNotificationsAsReadForRoom(chatRoomId); // ✨ 알림 읽음 처리
            navigate(`/chat/${chatRoomId}`); // ✨ [Fix] 수락 후 바로 해당 채팅방으로 이동
        } catch (error) {
            console.error("초대 수락 실패", error);
            showAlert("초대 수락에 실패했습니다.");
        }
    };

    // 초대 거절
    const handleRejectInvitation = async (chatRoomId, e) => {
        e.stopPropagation();
        try {
            await rejectInvitation(chatRoomId, user.memberId);
            loadChatRooms(); // 목록 새로고침
            markNotificationsAsReadForRoom(chatRoomId); // ✨ 알림 읽음 처리
        } catch (error) {
            console.error("초대 거절 실패", error);
            showAlert("초대 거절에 실패했습니다.");
        }
    };

    const handleCreateRoom = async ({ roomType, value, invitedMemberIds, roomImage }) => { // ✨ roomImage 추가
        if (roomType === 'GROUP') {
            // 그룹 채팅 생성
            try {
                const newRoom = await createChatRoom({
                    title: value,
                    roomType: "GROUP",
                    creatorId: user.memberId,
                    invitedMemberIds: invitedMemberIds,
                    roomImage: roomImage // ✨ 전달
                });
                loadChatRooms();
                navigate(`/chat/${newRoom.chatRoomId}`);
                setShowTypeModal(false);
            } catch (error) {
                console.error(error);
                showAlert("채팅방 생성에 실패했습니다.");
            }
        } else if (roomType === 'SINGLE') {
            // 1:1 채팅 생성
            try {
                const { searchMember } = await import('../../apis/chatApi');
                const members = await searchMember(value); // ✨ [Fix] 이제 배열 반환

                if (!members || members.length === 0) {
                    showAlert("해당 사용자를 찾을 수 없습니다.");
                    return;
                }

                // ✨ 첫 번째 검색 결과 사용 (정확한 닉네임이면 하나만 나올 것)
                const targetMember = members[0];

                const newRoom = await createChatRoom({
                    title: "",
                    roomType: "SINGLE",
                    creatorId: user.memberId,
                    targetMemberId: targetMember.memberId
                });
                
                loadChatRooms();
                navigate(`/chat/${newRoom.chatRoomId}`);
                setShowTypeModal(false);
            } catch (error) {
                console.error(error);
                showAlert("채팅방 생성에 실패했습니다.");
            }
        }
    };

    // 시간 포맷팅 (예: "오후 2:30" or "어제")
    const formatTime = (isoString) => {
        if (!isoString) return "";
        const date = new Date(isoString);
        const now = new Date();
        const isToday = date.toDateString() === now.toDateString();

        if (isToday) {
            return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } else {
            return date.toLocaleDateString([], { month: 'long', day: 'numeric' });
        }
    };

    // 채팅방 정렬 (즐겨찾기 → 최근 메시지 순)
    const sortedRooms = [...chatRooms].sort((a, b) => {
        // 1순위: 즐겨찾기
        if (a.favorite !== b.favorite) {
            return b.favorite - a.favorite;
        }
        // 2순위: 최근 메시지 시간
        if (!a.lastMessageAt) return 1;
        if (!b.lastMessageAt) return -1;
        return new Date(b.lastMessageAt) - new Date(a.lastMessageAt);
    });

    // 초대받은 채팅방 필터링
    const pendingRooms = sortedRooms.filter(room => room.invitationStatus === 'PENDING');
    const acceptedRooms = sortedRooms.filter(room => room.invitationStatus !== 'PENDING');

    // ✨ 메시지 미리보기 텍스트 변환
    const getLastMessagePreview = (room) => {
        if (!room.lastMessageContent) return "대화가 없습니다.";

        // 메시지 타입이 있는 경우 (백엔드 지원 시)
        if (room.lastMessageType === 'IMAGE') return "사진을 보냈습니다.";
        if (room.lastMessageType === 'FILE') return "파일을 보냈습니다.";
        if (room.lastMessageType === 'DELETED') return "삭제된 메시지입니다.";

        // 타입이 없더라도(구 데이터) content가 URL 형식이면 처리 (보완책)
        // 하지만 백엔드에서 이제 타입을 주므로 우선순위는 낮음.
        
        return room.lastMessageContent;
    };

    return (
        <div className={styles.container}>
            {/* 연결 상태 배너 */}
            {!connected && (
                <div className={styles.connectionBanner}>
                    ⚠️ 네트워크 연결이 끊어졌습니다. 재연결 중...
                </div>
            )}
            <div className={styles.header}>
                {/* 1. 타이틀 (왼쪽 끝) */}
                <div className={styles.headerTitle}>
                    <h2 className={styles.title}>채팅</h2>
                    {chatRooms.length > 0 && <span className={styles.count}>{chatRooms.length}</span>}
                </div>

                {/* 2. 닉네임 + 프로필 + 버튼 (오른쪽 끝) */}
                <div className={styles.headerRight}>
                    {/* 닉네임 표시 */}
                    <span className={styles.myNickname}>{user?.name}</span>
                    {/* Debugging User Object */}
                    {console.log("Current User in ChatRoomList:", user)}

                    {/* 내 프로필 */}
                    <div className={styles.myProfile} onClick={handleProfileClick} title="내 프로필 이미지 변경">
                         <img 
                            src={getFullUrl(user?.profileImageUrl || user?.profileImage) || "/default-profile.png"} 
                            alt="My Profile" 
                            className={styles.myProfileImg}
                            onError={(e) => {
                                if (e.target.dataset.failed) return;
                                e.target.dataset.failed = 'true';
                                e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                            }}
                         />
                         <input 
                             type="file" 
                             ref={fileInputRef} 
                             style={{ display: 'none' }} 
                             accept="image/*" 
                             onChange={handleProfileChange}
                         />
                    </div>
                    
                    <button className={styles.iconBtn} onClick={() => setShowTypeModal(true)} title="새 채팅방 생성">
                        {/* ✨ 배경 없는 + 버튼 스타일 */}
                        <svg viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
                            <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
                        </svg>
                    </button>
                </div>
            </div>

            {/* 초대받은 채팅방 섹션 */}
            {pendingRooms.length > 0 && (
                <>
                    <div className={styles.sectionHeader}>초대받은 채팅방</div>
                    <ul className={styles.list} style={{flex: 'none'}}>
                        {pendingRooms.map((room) => (
                            <li 
                                key={room.chatRoomId} 
                                className={`${styles.item} ${styles.pending}`}
                            >
                                <div className={styles.avatar}>
                                    <img 
                                        src={getFullUrl(room.otherMemberProfile) || "/default-profile.png"} 
                                        alt="Profile"
                                        onError={(e) => {
                                            if (e.target.dataset.failed) return;
                                            e.target.dataset.failed = 'true';
                                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='50' height='50' viewBox='0 0 24 24' fill='%23ccc'%3E%3Cpath d='M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'/%3E%3C/svg%3E";
                                        }}
                                    />
                                </div>
                                <div className={styles.content}>
                                    <div className={styles.topRow}>
                                        <span className={styles.name}>{room.title || "알 수 없는 대화방"}</span>
                                    </div>
                                    <div className={styles.bottomRow}>
                                        <span className={styles.message}>채팅방 초대</span>
                                    </div>
                                </div>
                                <div className={styles.invitationButtons}>
                                    <button 
                                        className={styles.acceptBtn} 
                                        onClick={(e) => handleAcceptInvitation(room.chatRoomId, e)}
                                        title="수락"
                                    >
                                        ✅
                                    </button>
                                    <button 
                                        className={styles.rejectBtn} 
                                        onClick={(e) => handleRejectInvitation(room.chatRoomId, e)}
                                        title="거절"
                                    >
                                        ❌
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {/* 일반 채팅방 섹션 */}
            <ul className={styles.list}>
                {acceptedRooms.map((room) => (
                    <li 
                        key={room.chatRoomId} 
                        className={`${styles.item} ${parseInt(roomId) === room.chatRoomId ? styles.active : ''} ${room.favorite ? styles.favorite : ''}`}
                        onClick={() => navigate(`/chat/${room.chatRoomId}`)}
                    >
                        <div className={styles.avatar}>
                            {/* ✨ 1:1 채팅은 상대방 프로필, 그룹 채팅은 방 이미지 */}
                            <img 
                                src={
                                    room.roomType === 'SINGLE' 
                                        ? (getFullUrl(room.otherMemberProfile) || "/default-profile.svg") 
                                        : (getFullUrl(room.roomImage) || "/default-room.svg") 
                                }
                                alt="Profile"
                                onError={(e) => {
                                    if (e.target.dataset.failed) return;
                                    e.target.dataset.failed = 'true';
                                    e.target.src = room.roomType === 'SINGLE' ? "/default-profile.svg" : "/default-room.svg";
                                }}
                            />
                            {/* ✨ 그룹 채팅 인원수 표시 */}
                            {(function() {
                                const url = room.roomType === 'SINGLE' 
                                    ? (getFullUrl(room.otherMemberProfile) || "/default-profile.svg") 
                                    : (getFullUrl(room.roomImage) || "/default-room.svg");
                                console.log(`Room ${room.chatRoomId} Image:`, url, "Raw:", room.roomType === 'SINGLE' ? room.otherMemberProfile : room.roomImage);
                            })()}
                            {room.roomType === 'GROUP' && room.memberCount > 0 && (
                                <span className={styles.groupCount}>{room.memberCount}</span>
                            )}
                        </div>
                        <div className={styles.content}>
                            <div className={styles.topRow}>
                                <span className={styles.name}>{room.title || "알 수 없는 대화방"}</span>
                                <span className={styles.time}>{formatTime(room.lastMessageAt)}</span>
                            </div>
                            <div className={styles.bottomRow}>
                                <span className={styles.message}>
                                    {getLastMessagePreview(room)}
                                </span>
                                {/* 현재 보고 있는 방이 아닐 때만 unreadCount 표시 */}
                                {room.unreadCount > 0 && parseInt(roomId) !== room.chatRoomId && (
                                    <span className={styles.badge}>{room.unreadCount}</span>
                                )}
                            </div>
                        </div>
                        {/* 즐겨찾기 아이콘 */}
                        <button
                            className={styles.favoriteBtn}
                            onClick={(e) => handleToggleFavorite(room.chatRoomId, e)}
                            title={room.favorite ? "즐겨찾기 해제" : "즐겨찾기"}
                        >
                            {room.favorite ? "⭐" : "☆"}
                        </button>
                    </li>
                ))}
            </ul>

            {/* 채팅방 타입 선택 모달 */}
            {showTypeModal && (
                <ChatRoomTypeModal
                    onClose={() => setShowTypeModal(false)}
                    onCreate={handleCreateRoom}
                    showAlert={showAlert} // Pass internal showAlert which proxies to CustomModal
                />
            )}
            
            {/* 공통 알림/확인 모달 - CustomModal 사용 */}
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={modalConfig.onCancel} // Close maps to Cancel for basic modal logic
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
                zIndex={11000} // ✨ z-index 추가 (ChatRoomTypeModal보다 높게)
            />
        </div>
    );
};

export default ChatRoomList;
