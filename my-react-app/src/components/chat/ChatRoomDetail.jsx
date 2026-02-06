import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useChat } from "../../context/ChatContext";
import {
  getMessages,
  uploadFile,
  getChatRoomDetail,
  markAsRead,
  leaveChatRoom,
  searchMessages,
  clearNotice
} from "../../apis/chatApi";
import MessageBubble from './MessageBubble';
import MemberManagementModal from './MemberManagementModal';
import FileUploadButton from './FileUploadButton';
import styles from './ChatRoomDetail.module.css';

const ChatRoomDetail = () => {
    const { roomId } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { client, loadChatRooms } = useChat(); // Use client and loadChatRooms from ChatContext
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [roomName, setRoomName] = useState("");
    const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로딩 상태 추가
    const [fileUploading, setFileUploading] = useState(false);
    const [showMenu, setShowMenu] = useState(false);
    const [showSearchModal, setShowSearchModal] = useState(false);
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [typingUsers, setTypingUsers] = useState({});
    const typingTimeoutRef = useRef(null);
    const [searchKeyword, setSearchKeyword] = useState("");
    const [searchResults, setSearchResults] = useState([]);
    const [userRole, setUserRole] = useState(null);
    const [noticeContent, setNoticeContent] = useState(null);
    
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!roomId || !user || !client || !client.connected) return;

        // 초기화
        setMessages([]);
        setIsInitialLoad(true); // 방 변경 시 초기화
        loadRoomData();

        // 메시지 구독
        const messageSubscription = client.subscribe(`/topic/chat/room/${roomId}`, async (message) => {
            const receivedMsg = JSON.parse(message.body);
            
            // 기존 메시지 업데이트 또는 새 메시지 추가
            setMessages((prev) => {
                const existingIndex = prev.findIndex(m => m.messageId === receivedMsg.messageId);
                if (existingIndex !== -1) {
                    // 기존 메시지를 업데이트 (삭제된 메시지 등)
                    const updated = [...prev];
                    updated[existingIndex] = receivedMsg;
                    return updated;
                } else {
                    // 새로운 메시지 추가
                    return [...prev, receivedMsg];
                }
            });
            
            if (user && receivedMsg.messageId) {
                try {
                    await markAsRead(roomId, user.id, receivedMsg.messageId);
                } catch (error) {
                    console.error("읽음 처리 실패", error);
                }
            }
        });

        // 타이핑 인디케이터 구독
        const typingSubscription = client.subscribe(`/topic/chat/room/${roomId}/typing`, (message) => {
            const typingData = JSON.parse(message.body);
            if (typingData.senderId !== user.id) {
                setTypingUsers(prev => ({...prev, [typingData.senderId]: typingData.senderName}));
                
                setTimeout(() => {
                    setTypingUsers(prev => {
                        const next = {...prev};
                        delete next[typingData.senderId];
                        return next;
                    });
                }, 3000);
            }
        });

        return () => {
            if (messageSubscription) messageSubscription.unsubscribe();
            if (typingSubscription) typingSubscription.unsubscribe();
        };
    }, [roomId, user, client, client?.connected]);

    // 메시지 추가될 때마다 스크롤 아래로
    useEffect(() => {
        if (messages.length > 0) {
            // 초기 로딩이면 'auto'(즉시), 아니면 'smooth'(부드럽게)
            scrollToBottom(isInitialLoad ? 'auto' : 'smooth');
            if (isInitialLoad) setIsInitialLoad(false);
        }
    }, [messages]);

    const loadRoomData = async () => {
        try {
            const roomData = await getChatRoomDetail(roomId);
            setRoomName(roomData.roomName || roomData.title);
            
            // 사용자 role 찾기
            const currentUser = roomData.participants?.find(p => p.memberId === user.id);
            if (currentUser) {
                setUserRole(currentUser.role);
            }
            
            // 공지사항 설정
            if (roomData.noticeContent) {
                setNoticeContent(roomData.noticeContent);
            }
            
            // memberId 추가하여 조회
            const msgs = await getMessages(roomId, null, user.id);
            setMessages(msgs);
            
            // 메시지 로드 후 읽음 처리
            if (msgs.length > 0 && user) {
                const lastMsg = msgs[msgs.length - 1];
                await markAsRead(roomId, user.id, lastMsg.messageId);
                // 중요: 목록(사이드바)의 안 읽은 개수 갱신
                loadChatRooms(); 
            }
        } catch (error) {
            console.error("데이터 로드 실패", error);
        }
    };

    const scrollToBottom = (behavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    const handleSend = () => {
        if (!input.trim() || !client?.connected) return;

        const payload = {
            chatRoomId: parseInt(roomId),
            senderId: user.id,
            content: input,
            messageType: 'TEXT'
        };

        client.publish({
            destination: '/app/chat/message',
            body: JSON.stringify(payload)
        });

        setInput('');
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setFileUploading(true);
        try {
            const fileUrl = await uploadFile(file);
            
            // 이미지 타입 확인
            const isImage = file.type.startsWith('image/');
            
            const payload = {
                chatRoomId: parseInt(roomId),
                senderId: user.id,
                content: fileUrl, // URL만 저장 (파일명은 MessageBubble에서 추출)
                messageType: isImage ? 'IMAGE' : 'FILE'
            };

            client.publish({
                destination: '/app/chat/message',
                body: JSON.stringify(payload)
            });

        } catch (error) {
            alert("파일 업로드 실패");
        } finally {
            setFileUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    // 채팅방 나가기
    const handleLeaveRoom = async () => {
        setShowMenu(false);
        if (!window.confirm("채팅방을 나가시겠습니까?")) return;
        
        try {
            await leaveChatRoom(roomId, user.id);
            alert("채팅방에서 나갔습니다.");
            navigate("/chat");
        } catch (error) {
            console.error("채팅방 나가기 실패", error);
            alert("채팅방 나가기에 실패했습니다.");
        }
    };

    // 파일 업로드 핸들러
    const handleFileUploaded = ({ url, type }) => {
        if (!client || !client.connected) {
            alert("WebSocket 연결이 끊어졌습니다.");
            return;
        }

        const payload = {
            chatRoomId: parseInt(roomId),
            senderId: user.id,
            content: url,
            messageType: type
        };

        client.publish({
            destination: '/app/chat/message',
            body: JSON.stringify(payload)
        });
    };

    // 메시지 검색
    const handleSearch = async () => {
        if (!searchKeyword.trim()) return;
        
        try {
            const results = await searchMessages(roomId, user.id, searchKeyword);
            setSearchResults(results);
        } catch (error) {
            console.error("검색 실패", error);
        }
    };
    
    // 공지 해제
    const handleClearNotice = async () => {
        if (!window.confirm("공지를 해제하시겠습니까?")) return;
        
        try {
            await clearNotice(roomId, user.id);
            setNoticeContent(null);
            alert("공지가 해제되었습니다.");
        } catch (error) {
            console.error("공지 해제 실패", error);
            alert(error.response?.data || "공지 해제 권한이 없거나 실패했습니다.");
        }
    };

    return (
        <div className={styles.container}>
            {/* 상단 헤더 */}
            <header className={styles.header}>
                <div className={styles.roomInfo}>
                    <img 
                        src="/default-profile.png" 
                        className={styles.roomImg} 
                        alt="room"
                        onError={(e) => {
                            if (e.target.dataset.failed) return;
                            e.target.dataset.failed = 'true';
                            e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Ccircle cx='20' cy='20' r='20' fill='%23ccc'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.3em' fill='white' font-size='16'%3ER%3C/text%3E%3C/svg%3E";
                        }}
                    />
                    <span className={styles.roomName}>{roomName || "채팅방"}</span>
                </div>
                <div className={styles.actions}>
                    <div style={{position: 'relative'}}>
                        <button 
                            className={styles.iconBtn} 
                            title="메뉴"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            ☰
                        </button>
                        {showMenu && (
                            <div className={styles.dropdownMenu}>
                                <button onClick={() => { setShowSearchModal(true); setShowMenu(false); }}>메시지 검색</button>
                                <button onClick={() => { setShowMemberModal(true); setShowMenu(false); }}>멤버 관리</button>
                                <button onClick={handleLeaveRoom}>채팅방 나가기</button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            {/* 공지 배너 */}
            {noticeContent && (
                <div className={styles.noticeBanner}>
                    <div className={styles.noticeContent}>
                        <span className={styles.noticeIcon}>📌</span>
                        <span>{noticeContent}</span>
                    </div>
                    {(userRole === 'OWNER' || userRole === 'ADMIN') && (
                        <button 
                            className={styles.clearNoticeBtn}
                            onClick={handleClearNotice}
                            title="공지 해제"
                        >
                            ✕
                        </button>
                    )}
                </div>
            )}

            {/* 메시지 영역 */}
            <div className={styles.messageArea}>
                {messages.map((msg) => (
                    <MessageBubble 
                        key={msg.messageId} 
                        message={msg} 
                        onReactionUpdate={loadRoomData}
                        userRole={userRole}
                    />
                ))}
                {Object.keys(typingUsers).length > 0 && (
                    <div className={styles.typingIndicator}>
                        {Object.values(typingUsers)[0]}님이 입력 중...
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* 입력창 */}
            <div className={styles.inputArea}>
                <FileUploadButton onFileUploaded={handleFileUploaded} />
                <textarea
                    className={styles.input}
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
        
                        // 타이핑 이벤트 발행 (디바운스)
                        if (client?.connected && e.target.value.length > 0) {
                            clearTimeout(typingTimeoutRef.current);
                            typingTimeoutRef.current = setTimeout(() => {
                                client.publish({
                                    destination: '/app/chat/typing',
                                    body: JSON.stringify({
                                        chatRoomId: parseInt(roomId),
                                        senderId: user.id,
                                        senderName: user.userName || user.name
                                    })
                                });
                            }, 300);
                        }
                    }}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요"
                    rows={1}
                />
                <button 
                    className={`${styles.sendBtn} ${input.trim() ? styles.active : ''}`} 
                    onClick={handleSend}
                    disabled={!input.trim()}
                >
                    전송
                </button>
            </div>

            {/* 검색 모달 */}
            {showSearchModal && (
                <div className={styles.modal} onClick={() => setShowSearchModal(false)}>
                    <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
                        <h3>메시지 검색</h3>
                        <div className={styles.searchBox}>
                            <input
                                type="text"
                                placeholder="검색어 입력"
                                value={searchKeyword}
                                onChange={(e) => setSearchKeyword(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                            />
                            <button onClick={handleSearch}>검색</button>
                        </div>
                        <div className={styles.searchResults}>
                            {searchResults.map(msg => (
                                <div key={msg.messageId} className={styles.resultItem}>
                                    <div>{msg.senderName}: {msg.content}</div>
                                    <div className={styles.resultTime}>
                                        {new Date(msg.createdAt).toLocaleString()}
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowSearchModal(false)}>닫기</button>
                    </div>
                </div>
            )}
            {/* 멤버 관리 모달 */}
            {showMemberModal && (
                <MemberManagementModal
                    roomId={roomId}
                    currentUser={user}
                    onClose={() => setShowMemberModal(false)}
                    onUpdate={loadRoomData}
                />
            )}
        </div>
    );
};

export default ChatRoomDetail;
