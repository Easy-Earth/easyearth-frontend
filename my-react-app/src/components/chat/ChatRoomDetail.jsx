import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getMessages, markAsRead, leaveChatRoom, updateRole, kickMember, getChatRoomUsers, setNotice, clearNotice } from '../../apis/chatApi'; // Import new APIs
import MessageBubble from './MessageBubble';
import FileUploadButton from './FileUploadButton';
import MemberManagementModal from './MemberManagementModal';
import CustomModal from '../common/CustomModal';
import styles from './ChatRoomDetail.module.css';
import { useNavigate } from 'react-router-dom';

const ChatRoomDetail = ({ roomId }) => {
    const { client, connected, loadChatRooms } = useChat();
    const { user } = useAuth();
    const { markNotificationsAsReadForRoom } = useNotification();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const isFirstLoad = useRef(true); // Flag for initial scroll
    const [input, setInput] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const messagesEndRef = useRef(null);
    const observerTarget = useRef(null); // For infinite scroll detection
    
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [roomMembers, setRoomMembers] = useState([]);
    const [roomInfo, setRoomInfo] = useState({ title: '', type: 'SINGLE', members: [], creatorId: null, noticeContent: null, noticeMessageId: null });
    
    // ✨ Reply State
    const [replyTo, setReplyTo] = useState(null);

    // ✨ Modal state
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        title: "",
        message: "",
        type: "alert", 
        onConfirm: null, 
        onCancel: null
    });

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));

    const showAlert = (message, title = "알림") => {
        setModalConfig({
            isOpen: true,
            title,
            message,
            type: "alert",
            onConfirm: closeModal,
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

    // ✨ Fetch Room Info (to check ownership and notice)
    const fetchRoomInfo = async () => {
        try {
            const { getChatRoomDetail } = await import('../../apis/chatApi');
            const data = await getChatRoomDetail(roomId);
            console.log("🏠 Room Info Loaded:", data); // Debug log
            setRoomInfo(data);
        } catch (error) {
            console.error("채팅방 정보 로드 실패", error);
        }
    };

    // 1. 메시지 로드 및 구독 설정
    useEffect(() => {
        if (!client || !connected || !roomId) return;

        // Reset
        setMessages([]);
        setPage(0);
        setHasMore(true);
        isFirstLoad.current = true;
        setReplyTo(null); // Reset reply state

        // Fetch initial messages and room info
        fetchMessages(0);
        fetchRoomInfo();

        // ✨ Mark as read immediately when entering the room
        markAsRead(roomId, user.memberId, null).then(() => {
            loadChatRooms(); // ✨ Refresh chat list to update unread count globally
        });
        
        // ✨ Clear global notifications for this room
        markNotificationsAsReadForRoom(roomId);

        // Subscribe to room topic
        const roomSubscription = client.subscribe(`/topic/chat/room/${roomId}`, (message) => {
            const receivedMsg = JSON.parse(message.body);
            
            // ✨ Upsert Logic: Update if exists, Append if new
            setMessages(prev => {
                const receivedId = String(receivedMsg.messageId);
                const existingIndex = prev.findIndex(msg => String(msg.messageId) === receivedId);
                
                let updatedMessages = [...prev];

                if (existingIndex !== -1) {
                    // Update existing message
                    updatedMessages[existingIndex] = receivedMsg;
                } else {
                    // Append new message
                    updatedMessages.push(receivedMsg);
                }
                
                // ✨ Fix: If a message is deleted, update any replies that reference it
                if (receivedMsg.messageType === 'DELETED') {
                    updatedMessages = updatedMessages.map(msg => {
                        if (String(msg.parentMessageId) === receivedId) {
                            return {
                                ...msg,
                                parentMessageContent: "삭제된 메시지입니다.",
                                // Optional: You might want to update parentMessageSenderName too if needed, 
                                // but usually, we just hide content.
                            };
                        }
                        return msg;
                    });
                }
                
                return updatedMessages;
            });
            
            // If it's a message I didn't send, mark as read immediately if window focused
            if (receivedMsg.senderId !== user.memberId) {
                markAsRead(roomId, user.memberId, receivedMsg.messageId).then(() => {
                    loadChatRooms(); // ✨ Refresh list logic
                });
            }

            // Refresh room info if it's a NOTICE type message or related to settings
            if (receivedMsg.messageType === 'NOTICE' || receivedMsg.type === 'NOTICE') {
                fetchRoomInfo();
            }
            
            // ✨ Handle Notice Update Event (Real-time banner update)
            if (receivedMsg.type === 'NOTICE_UPDATED') {
                setRoomInfo(prev => ({
                    ...prev,
                    noticeContent: receivedMsg.noticeContent,
                    noticeMessageId: receivedMsg.noticeMessageId,
                    noticeSenderName: receivedMsg.senderName // ✨ Update sender name
                }));
            }
            
            if (receivedMsg.type === 'NOTICE_CLEARED') {
                setRoomInfo(prev => ({
                    ...prev,
                    noticeContent: null,
                    noticeMessageId: null,
                    noticeSenderName: null
                }));
            }
        });

        // ✨ Subscribe to reaction updates
        const reactionSubscription = client.subscribe(`/topic/chat/room/${roomId}/reaction`, (message) => {
            const updatedMsg = JSON.parse(message.body);
            setMessages(prev => {
                const updatedId = String(updatedMsg.messageId);
                const existingIndex = prev.findIndex(msg => String(msg.messageId) === updatedId);
                
                if (existingIndex !== -1) {
                    const newMessages = [...prev];
                    newMessages[existingIndex] = updatedMsg;
                    return newMessages;
                }
                return prev;
            });
        });

        // Subscribe to read updates
        const readSubscription = client.subscribe(`/topic/chat/room/${roomId}/read`, (message) => {
            const readEvent = JSON.parse(message.body);
            if (readEvent.type === 'READ_UPDATE') {
                setMessages(prev => prev.map(msg => {
                    if (readEvent.unreadCountMap && readEvent.unreadCountMap[msg.messageId] !== undefined) {
                        return { ...msg, unreadCount: readEvent.unreadCountMap[msg.messageId] };
                    }
                    return msg;
                }));
                loadChatRooms(); // ✨ Update chat list unread counts
            }
        });

        return () => {
            roomSubscription.unsubscribe();
            reactionSubscription.unsubscribe(); // Unsubscribe reaction
            readSubscription.unsubscribe();
        };
    }, [roomId, client, connected]);

    // 2. 메시지 가져오기 (무한 스크롤)
    const fetchMessages = async (cursorId) => {
        try {
            const data = await getMessages(roomId, cursorId, user.memberId); 
            
            if (Array.isArray(data) && data.length > 0) {
                // 커서가 0이면 처음 로드 (최신 메시지), 아니면 이전 메시지
                setMessages(prev => {
                    const newMessages = data.reverse();
                    if (cursorId !== 0) {
                        isFetchingOld.current = true; // 과거 메시지 로드 플래그 설정
                        return [...newMessages, ...prev];
                    }
                    return newMessages;
                });

                if (data.length === 0) setHasMore(false); 
            } else {
                setHasMore(false);
            }
        } catch (error) {
            console.error("메시지 로드 실패", error);
        }
    };

    // ✨ Infinite Scroll Observer
    useEffect(() => {
        if (!observerTarget.current || !hasMore) return;

        const observer = new IntersectionObserver(
            entries => {
                if (entries[0].isIntersecting && hasMore) {
                    // 가장 오래된 메시지의 ID를 커서로 사용
                    const firstMessageId = messages.length > 0 ? messages[0].messageId : 0;
                    // 0이면 처음 로드인데, 이미 로드된 상태에서 스크롤 올리는 거니까 firstMessageId 사용
                    if (firstMessageId !== 0) {
                        // 스크롤 위치 유지를 위한 현재 높이 저장
                        const scrollContainer = messagesEndRef.current?.parentElement;
                        const previousScrollHeight = scrollContainer?.scrollHeight;

                        fetchMessages(firstMessageId).then(() => {
                            // 메시지 추가 후 스크롤 위치 조정
                            requestAnimationFrame(() => {
                                if (scrollContainer) {
                                    const currentScrollHeight = scrollContainer.scrollHeight;
                                    scrollContainer.scrollTop = currentScrollHeight - previousScrollHeight;
                                }
                            });
                        });
                    }
                }
            },
            { threshold: 1.0 }
        );

        observer.observe(observerTarget.current);

        return () => observer.disconnect();
    }, [messages, hasMore]); 

    // 3. 스크롤 하단 고정
    useEffect(() => {
       // logic...
    }, [messages]); 

    // *스크롤 오토 포커싱 개선*
    const isFetchingOld = useRef(false);

    useEffect(() => {
         // 메시지가 추가되었을 때
         if (messages.length > 0) {
             const lastMessage = messages[messages.length - 1];
             
             // 무한 스크롤로 과거 메시지가 로드된 경우
             if (isFetchingOld.current) {
                 isFetchingOld.current = false;
                 return; 
             }
             
             // 첫 로드 시에는 즉시 이동 (깜빡임 방지), 그 외에는 부드럽게 이동
             if (isFirstLoad.current) {
                 isFirstLoad.current = false;
                 messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
             } else {
                 messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
             }
         }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const message = {
            chatRoomId: roomId,
            senderId: user.memberId,
            content: input,
            messageType: 'TEXT',
            parentMessageId: replyTo ? replyTo.messageId : null,
        };

        client.publish({
            destination: '/app/chat/message',
            body: JSON.stringify(message)
        });

        setInput('');
        setReplyTo(null);
    };

    const handleFileUpload = (fileUrl, type) => {
        const message = {
            chatRoomId: roomId,
            senderId: user.memberId,
            content: fileUrl,
            messageType: type,
            parentMessageId: replyTo ? replyTo.messageId : null,
        };
        
        client.publish({
            destination: '/app/chat/message',
            body: JSON.stringify(message)
        });
        setReplyTo(null);
    };

    const handleLeave = () => {
        showConfirm("채팅방을 나가시겠습니까?", async () => {
            try {
                await leaveChatRoom(roomId, user.memberId);
                loadChatRooms();
                navigate('/chat');
            } catch (error) {
                console.error(error);
                showAlert("나가기 실패");
            }
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 멤버 모달 열릴 때 멤버 리스트 갱신
    useEffect(() => {
        if (showMemberModal && roomId) {
            getChatRoomUsers(roomId)
                .then(data => setRoomMembers(data))
                .catch(err => console.error("멤버 조회 실패", err));
        }
    }, [showMemberModal, roomId]);

    // ✨ Feature Handlers
    const handleSetNotice = async (message) => {
        try {
            await setNotice(roomId, user.memberId, message.messageId);
            fetchRoomInfo(); 
        } catch (error) {
            console.error("공지 설정 실패", error);
            showAlert("공지 등록에 실패했습니다.");
        }
    };

    const handleClearNotice = async () => {
        showConfirm("공지를 내리시겠습니까?", async () => {
             try {
                await clearNotice(roomId, user.memberId);
                fetchRoomInfo();
            } catch (error) {
                console.error("공지 해제 실패", error);
                showAlert("공지 해제에 실패했습니다.");
            }
        });
    };

    const handleRefresh = () => {
        fetchRoomInfo(); 
    };

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>
                    {roomInfo.title || (roomInfo.roomType === 'SINGLE' ? roomInfo.otherMemberName : '그룹 채팅')}
                </h3>
                <div className={styles.actions}>
                    <button onClick={() => setShowMemberModal(true)} className={styles.actionBtn}>멤버</button>
                    <button onClick={handleLeave} className={styles.leaveBtn}>나가기</button>
                </div>
            </div>

            {/* ✨ Notice Banner (Refined) */}
            {roomInfo.noticeContent && (
                <div className={styles.noticeBanner}>
                    <div className={styles.noticeContentWrapper}>
                        <span className={styles.noticeIcon}>📢</span>
                        <div className={styles.noticeTextContainer}>
                             <span className={styles.noticeText}>{roomInfo.noticeContent}</span>
                             {/* ✨ 공지 작성자 표시 */}
                             {roomInfo.noticeSenderName && (
                                <span className={styles.noticeSender}> - {roomInfo.noticeSenderName}</span>
                             )}
                        </div>
                    </div>
                    {/* 공지 내리기: 작성자 본인 or 방장/관리자 (여기선 간단히 누구나 내릴 수 있는지 or 권한 체크) */}
                    {/* 요청사항: "공지는 모든 사람이 할 수 있게" -> 내리기도 모든 사람이? 보통은 아님. */}
                    {/* 하지만 일단 버튼은 표시하고 백엔드에서 막거나(현재 백엔드는 품), 편의상 둠. */}
                    <button onClick={handleClearNotice} className={styles.noticeCloseBtn} title="공지 내리기">✖</button>
                </div>
            )}

            {/* Message List */}
            <div className={styles.messageList}>
                <div ref={observerTarget} style={{ height: '10px' }} />
                {messages.map((msg, index) => (
                    <MessageBubble 
                        key={msg.messageId || index} 
                        message={msg} 
                        onReply={setReplyTo} 
                        onSetNotice={handleSetNotice}
                        isOwner={String(roomInfo.creatorId) === String(user.memberId)}
                        onRefresh={handleRefresh}
                    />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputAreaWrapper}>
                {/* ✨ Reply Banner */}
                {replyTo && (
                    <div className={styles.replyBanner}>
                        <div className={styles.replyInfo}>
                            <span className={styles.replyToName}>To. {replyTo.senderName}</span>
                            <span className={styles.replyToContent}>{replyTo.content}</span>
                        </div>
                        <button onClick={() => setReplyTo(null)} className={styles.replyCloseBtn}>✖</button>
                    </div>
                )}
                
                <div className={styles.inputArea}>
                    <FileUploadButton onFileUploaded={handleFileUpload} />
                    <textarea 
                        className={styles.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder={replyTo ? `${replyTo.senderName}님에게 답장...` : "메시지를 입력하세요..."}
                        rows={1}
                    />
                    <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()}>
                        전송
                    </button>
                </div>
            </div>

            {/* Modals */}
            {showMemberModal && (
                <MemberManagementModal 
                    onClose={() => setShowMemberModal(false)}
                    roomId={roomId}
                    currentMembers={roomMembers}
                    currentUserId={user.memberId}
                    isOwner={String(roomInfo.creatorId) === String(user.memberId)}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}

            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={modalConfig.onCancel} // Maps Close to Cancel/Close
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
            />
        </div>
    );
};

export default ChatRoomDetail;
