import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { getMessages, markAsRead, leaveChatRoom, updateRole, kickMember, getChatRoomUsers, setNotice, clearNotice, getChatRoomDetail, searchMessages } from '../../apis/chatApi'; // searchMessages 추가
import { getFullUrl } from '../../utils/imageUtil';
import MessageBubble from './MessageBubble';
import FileUploadButton from './FileUploadButton';
import MemberManagementModal from './MemberManagementModal';
import CustomModal from '../common/CustomModal';
import UserDatailModal from '../common/UserDatailModal';
import styles from './ChatRoomDetail.module.css';
import { useNavigate } from 'react-router-dom';

const ChatRoomDetail = ({ roomId }) => {
    const { client, connected, loadChatRooms } = useChat();
    const { user } = useAuth();
    const { markNotificationsAsReadForRoom } = useNotification();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const isFirstLoad = useRef(true);
    const [input, setInput] = useState('');
    const [hasMore, setHasMoreState] = useState(true);
    const hasMoreRef = useRef(true); // ✨ [Fix] Ref로 관리하여 의존성 제거
    const messagesEndRef = useRef(null);
    const observerTarget = useRef(null);
    const prevScrollHeight = useRef(0);
    
    const setHasMore = (val) => {
        hasMoreRef.current = val;
        setHasMoreState(val);
    };
    
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [roomMembers, setRoomMembers] = useState([]);
    const [roomInfo, setRoomInfo] = useState({ title: '', type: 'SINGLE', members: [], creatorId: null, noticeContent: null, noticeMessageId: null, roomImage: null });
    
    const [replyTo, setReplyTo] = useState(null);
    const [modalConfig, setModalConfig] = useState({
        isOpen: false, title: "", message: "", type: "alert", onConfirm: null, onCancel: null
    });
    
    // ✨ 검색 관련 state
    const [showSearch, setShowSearch] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [searchOffset, setSearchOffset] = useState(0);
    const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);

    const [showProfileModal, setShowProfileModal] = useState(false);

    const closeModal = () => setModalConfig(prev => ({ ...prev, isOpen: false }));
    
    const showAlert = (message, title = "알림") => { 
        setModalConfig({ isOpen: true, title, message, type: "alert", onConfirm: closeModal, onCancel: closeModal }); 
    };
    
    const showConfirm = (message, onConfirm, title = "확인") => {
        setModalConfig({ isOpen: true, title, message, type: "confirm", onConfirm: () => { onConfirm(); closeModal(); }, onCancel: closeModal });
    };

    const fetchRoomInfo = useCallback(async () => {
        try {
            const data = await getChatRoomDetail(roomId);
            console.log("🏠 Room Info Loaded:", data); 
            setRoomInfo(data);
        } catch (error) {
            console.error("채팅방 정보 로드 실패", error);
        }
    }, [roomId]);

    const fetchMessages = useCallback(async (cursorId) => {
        try {
            // ✨ [Fix] hasMoreRef 사용
            if (!hasMoreRef.current && cursorId !== 0) return;
            
            const data = await getMessages(roomId, cursorId, user.memberId);
            
            if (data.length === 0) {
                setHasMore(false);
                return;
            }

            if (cursorId === 0) {
                setMessages(data);
            } else {
                setMessages(prev => [...data, ...prev]);
            }
            
             if (data.length < 30) setHasMore(false);

        } catch (error) {
            console.error("메시지 로드 실패", error);
        }
    }, [roomId, user.memberId]); // ✨ [Fix] hasMore 제거 -> Stable Function


    // ✨ [Fix] 초기화 Effect 분리 (의존성 최소화)
    useEffect(() => {
        if (!connected || !roomId) return;

        setMessages([]);
        setHasMore(true);
        isFirstLoad.current = true;
        setReplyTo(null);

        const initializeRoom = async () => {
            try {
                // ✨ [Fix] 읽음 처리를 먼저 실행하여 unreadCount 갱신
                await markAsRead(roomId, user.memberId, null);
                await fetchMessages(0);
                await fetchRoomInfo();
                loadChatRooms(); 
            } catch (error) {
                console.error("채팅방 초기화 실패", error);
            }
        };
        initializeRoom();
        markNotificationsAsReadForRoom(roomId);
    }, [roomId, connected]); // ✨ fetchMessages 제거 (Stable 하므로 포함해도 되지만 명시적 분리)


    // ✨ [Fix] 구독 Effect 분리 (fetchMessages 의존성 제거)
    useEffect(() => {
        if (!client || !connected || !roomId) return;

        // Subscribe to room topic
        const roomSubscription = client.subscribe(`/topic/chat/room/${roomId}`, (message) => {
            const receivedMsg = JSON.parse(message.body);
            
            if (receivedMsg.type === 'ROOM_UPDATE') {
                console.log("📝 방 정보 업데이트 수신:", receivedMsg);
                setRoomInfo(prev => ({
                    ...prev,
                    title: receivedMsg.title !== undefined ? receivedMsg.title : prev.title,
                    roomImage: receivedMsg.roomImage !== undefined ? receivedMsg.roomImage : prev.roomImage
                }));
                return; 
            }

            // Message handling
            setMessages(prev => {
                const receivedId = String(receivedMsg.messageId || receivedMsg.id);
                const existingIndex = prev.findIndex(msg => String(msg.messageId || msg.id) === receivedId);
                let updatedMessages = [...prev];

                if (existingIndex !== -1) {
                    updatedMessages[existingIndex] = { ...updatedMessages[existingIndex], ...receivedMsg };
                } else {
                    updatedMessages.push(receivedMsg);
                }
                
                if (receivedMsg.messageType === 'DELETED') {
                    updatedMessages = updatedMessages.map(msg => {
                        if (String(msg.parentMessageId) === receivedId) {
                            return { ...msg, parentMessageContent: "삭제된 메시지입니다." };
                        }
                        return msg;
                    });
                }
                return updatedMessages;
            });
            
            if (receivedMsg.senderId !== user.memberId) {
                markAsRead(roomId, user.memberId, receivedMsg.messageId).then(() => { loadChatRooms(); });
            }

            if (receivedMsg.messageType === 'NOTICE' || receivedMsg.type === 'NOTICE') { fetchRoomInfo(); }
            
            if (receivedMsg.type === 'NOTICE_UPDATED') {
                setRoomInfo(prev => ({ ...prev, noticeContent: receivedMsg.noticeContent, noticeMessageId: receivedMsg.noticeMessageId, noticeSenderName: receivedMsg.senderName }));
            }
            
            if (receivedMsg.type === 'NOTICE_CLEARED') {
                setRoomInfo(prev => ({ ...prev, noticeContent: null, noticeMessageId: null, noticeSenderName: null }));
            }
        });

        // Reaction subscription
        const reactionSubscription = client.subscribe(`/topic/chat/room/${roomId}/reaction`, (message) => {
            const event = JSON.parse(message.body);
            if (event.type === 'REACTION_UPDATE') {
                setMessages(prev => {
                    const updatedId = String(event.messageId);
                    const existingIndex = prev.findIndex(msg => String(msg.messageId || msg.id) === updatedId);
                    if (existingIndex !== -1) {
                        const newMessages = [...prev];
                        const targetMsg = newMessages[existingIndex];
                        let newReactions = event.reactions || [];

                        if (String(event.reactorId) === String(user.memberId)) {
                             newReactions = newReactions.map(r => {
                                 if (r.emojiType === event.emojiType) {
                                     if (event.action === 'ADD' || event.action === 'UPDATE') { return { ...r, selectedByMe: true }; } 
                                     else if (event.action === 'REMOVE') { return { ...r, selectedByMe: false }; }
                                 }
                                 return { ...r, selectedByMe: false }; 
                             });
                        } else {
                            newReactions = newReactions.map(newR => {
                                const oldR = targetMsg.reactions?.find(o => o.emojiType === newR.emojiType);
                                return { ...newR, selectedByMe: oldR ? oldR.selectedByMe : false };
                            });
                        }
                        newMessages[existingIndex] = { ...targetMsg, reactions: newReactions };
                        return newMessages;
                    }
                    return prev;
                });
            }
        });

        const readSubscription = client.subscribe(`/topic/chat/room/${roomId}/read`, (message) => {
            const readEvent = JSON.parse(message.body);
            if (readEvent.type === 'READ_UPDATE') {
                setMessages(prev => prev.map(msg => {
                    if (readEvent.unreadCountMap && readEvent.unreadCountMap[msg.messageId] !== undefined) {
                        return { ...msg, unreadCount: readEvent.unreadCountMap[msg.messageId] };
                    }
                    return msg;
                }));
                loadChatRooms(); 
            }
        });

        return () => { roomSubscription.unsubscribe(); reactionSubscription.unsubscribe(); readSubscription.unsubscribe(); };
    }, [roomId, client, connected, user.memberId]); // ✨ 의존성 대폭 축소 (fetchMessages, loadChatRooms 등 제외 -> Stable)


    // Infinite Scroll
    const handleObserver = useCallback((entries) => {
        const target = entries[0];
        if (target.isIntersecting && hasMore && messages.length > 0) {
            const firstMsgId = messages[0].messageId;
            fetchMessages(firstMsgId);
        }
    }, [hasMore, messages, fetchMessages]);

    useEffect(() => {
        const option = { root: null, rootMargin: "20px", threshold: 1.0 };
        const observer = new IntersectionObserver(handleObserver, option);
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer && observer.disconnect();
    }, [handleObserver]);

    // Scroll to bottom on new message (only if user is at bottom)
    const previousMessageCountRef = useRef(0);
    const messagesContainerRef = useRef(null);
    const isUserAtBottomRef = useRef(true); // 사용자가 하단에 있는지 추적
    
    // 스크롤 위치 추적
    useEffect(() => {
        // messageList 컨테이너 찾기 (실제 DOM에서 찾기)
        const findMessageContainer = () => {
            // styles.messageList를 사용하는 div 찾기
            const containers = document.querySelectorAll('[class*="messageList"]');
            return containers[0]; // 첫 번째 매칭되는 요소
        };
        
        const container = findMessageContainer();
        if (!container) return;
        
        messagesContainerRef.current = container;
        
        const handleScroll = () => {
            const { scrollTop, scrollHeight, clientHeight } = container;
            // 하단에서 100px 이내면 하단으로 간주
            isUserAtBottomRef.current = scrollHeight - scrollTop - clientHeight < 100;
        };
        
        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);
    
    useEffect(() => {
        if (!messagesEndRef.current || messages.length === 0) return;
        
        // ✨ 첨 로드 시에만 스크롤
        if (isFirstLoad.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            isFirstLoad.current = false;
            previousMessageCountRef.current = messages.length;
            isUserAtBottomRef.current = true;
        } 
        // ✨ 새 메시지가 추가되고 사용자가 하단에 있을 때만 스크롤
        else if (messages.length > previousMessageCountRef.current && isUserAtBottomRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            previousMessageCountRef.current = messages.length;
        } else if (messages.length > previousMessageCountRef.current) {
            // 메시지 카운트는 업데이트하지만 스크롤은 하지 않음
            previousMessageCountRef.current = messages.length;
        }
        // 무한 스크롤로 과거 메시지 로드 시에는 스크롤 하지 않음
    }, [messages]);

    const handleSend = () => {
        if (!input.trim() || !connected) return;

        const msgDto = {
            chatRoomId: roomId,
            senderId: user.memberId,
            content: input,
            messageType: 'TEXT',
            parentMessageId: replyTo ? replyTo.messageId : null
        };

        client.publish({ destination: '/app/chat/message', body: JSON.stringify(msgDto) });
        setInput('');
        setReplyTo(null);
    };

    const handleFileUpload = (fileUrl, type) => {
        if (!connected) return;

        const msgDto = {
            chatRoomId: roomId,
            senderId: user.memberId,
            content: fileUrl,
            messageType: type, // IMAGE or FILE
            parentMessageId: replyTo ? replyTo.messageId : null
        };
        
        client.publish({ destination: '/app/chat/message', body: JSON.stringify(msgDto) });
        setReplyTo(null);
    };

    const handleLeave = () => {
        showConfirm("정말 채팅방을 나가시겠습니까?", async () => {
            try {
                await leaveChatRoom(roomId, user.memberId);
                // ✨ [Fix] 채팅방 목록 갱신 후 이동
                await loadChatRooms();
                navigate('/chat');
            } catch (error) {
                console.error("채팅방 나가기 실패", error);
                showAlert(error.response?.data || "나가기에 실패했습니다.");
            }
        });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    useEffect(() => {
        if (showMemberModal && roomId) {
            getChatRoomUsers(roomId).then(data => setRoomMembers(data)).catch(err => console.error("멤버 조회 실패", err));
        }
    }, [showMemberModal, roomId]);

    const handleSetNotice = async (message) => {
        try {
            await setNotice(roomId, user.memberId, message.messageId);
        } catch (error) {
             console.error("공지 설정 실패", error);
             showAlert("공지 설정에 실패했습니다.");
        }
    };

    const handleClearNotice = async () => {
        try {
            await clearNotice(roomId, user.memberId);
        } catch (error) {
            console.error("공지 해제 실패", error);
             showAlert("공지 해제에 실패했습니다.");
        }
    };

    const handleRefresh = () => { fetchRoomInfo(); fetchMessages(0); };
    const handleImageLoad = () => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); };

    // ✨ 검색 핸들러 함수들
    const handleSearch = async () => {
        if (!searchKeyword.trim()) {
            showAlert("검색어를 입력해주세요.");
            return;
        }
        
        try {
            // 처음 10개 검색
            const results = await searchMessages(roomId, user.memberId, searchKeyword, 10, 0);
            console.log('🔍 Search results:', results);
            if (results.length === 0) {
                showAlert("검색 결과가 없습니다.");
                setSearchResults([]);
                setCurrentSearchIndex(-1);
                setSearchOffset(0);
                setHasMoreSearchResults(false);
                return;
            }
            
            setSearchResults(results);
            setSearchOffset(10);
            setHasMoreSearchResults(results.length === 10); // 10개면 더 있을 수 있음
            
            // 가장 최근 결과 (인덱스 0)로 이동
            setCurrentSearchIndex(0);
            console.log('🔍 First result messageId:', results[0].messageId);
            scrollToSearchResult(results[0].messageId);
        } catch (error) {
            console.error("검색 실패", error);
            showAlert("검색 중 오류가 발생했습니다.");
        }
    };

    const scrollToSearchResult = (messageId) => {
        console.log('📍 Scrolling to messageId:', messageId);
        setHighlightedMessageId(messageId);
        
        // 메시지 요소 찾기 및 스크롤
        setTimeout(() => {
            const messageElement = document.querySelector(`[data-message-id="${messageId}"]`);
            console.log('📍 Found element:', messageElement);
            if (messageElement) {
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                console.warn('⚠️ Message element not found for ID:', messageId);
            }
        }, 100);

        // 3초 후 하이라이트 제거
        setTimeout(() => {
            console.log('📍 Removing highlight');
            setHighlightedMessageId(null);
        }, 3000);
    };

    const handlePrevSearchResult = async () => {
        console.log('◀ Prev button clicked, currentIndex:', currentSearchIndex, 'total:', searchResults.length);
        if (searchResults.length === 0) return;
        
        // 더 오래된 결과로 이동
        const newIndex = currentSearchIndex + 1;
        console.log('◀ New index will be:', newIndex);
        
        // 현재 배열의 마지막에 도달하면 다음 10개 로드
        if (newIndex >= searchResults.length && hasMoreSearchResults) {
            console.log('◀ Loading more results, offset:', searchOffset);
            try {
                const nextResults = await searchMessages(roomId, user.memberId, searchKeyword, 10, searchOffset);
                console.log('◀ Loaded additional results:', nextResults.length);
                if (nextResults.length > 0) {
                    const updatedResults = [...searchResults, ...nextResults];
                    setSearchResults(updatedResults);
                    setSearchOffset(prev => prev + nextResults.length);
                    setHasMoreSearchResults(nextResults.length === 10);
                    
                    // 새로 추가된 첫 번째 메시지로 이동
                    setCurrentSearchIndex(newIndex);
                    // updatedResults 배열에서 newIndex 위치의 messageId 사용
                    setTimeout(() => {
                        console.log('◀ Scrolling to newly loaded message at index:', newIndex);
                        scrollToSearchResult(updatedResults[newIndex].messageId);
                    }, 100);
                }
            } catch (error) {
                console.error("추가 검색 실패", error);
            }
        } else if (newIndex < searchResults.length) {
            // 인덱스가 범위 내에 있으면 이동
            console.log('◀ Navigating to existing result at index:', newIndex);
            setCurrentSearchIndex(newIndex);
            scrollToSearchResult(searchResults[newIndex].messageId);
        }
    };

    const handleNextSearchResult = () => {
        console.log('▶ Next button clicked, currentIndex:', currentSearchIndex);
        if (searchResults.length === 0) return;
        
        // 더 최근 결과로 이동 (인덱스 감소)
        if (currentSearchIndex > 0) {
            const newIndex = currentSearchIndex - 1;
            console.log('▶ Navigating to index:', newIndex);
            setCurrentSearchIndex(newIndex);
            scrollToSearchResult(searchResults[newIndex].messageId);
        } else {
            console.log('▶ Already at most recent result (index 0)');
        }
        // 이미 가장 최근 결과(인덱스 0)에 있으면 아무것도하지 않음
    };


    const handleCloseSearch = () => {
        setShowSearch(false);
        setSearchKeyword('');
        setSearchResults([]);
        setCurrentSearchIndex(-1);
        setHighlightedMessageId(null);
        setSearchOffset(0);
        setHasMoreSearchResults(false);
    };


    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                {/* ✨ Header Image */}
                <div className={styles.headerImage}>
                    <img 
                        src={
                            roomInfo.roomType === 'SINGLE' 
                                ? (getFullUrl(roomInfo.otherMemberProfile) || "/default-profile.svg") 
                                : (getFullUrl(roomInfo.roomImage) || "/default-room.svg") 
                        }
                        alt="Room"
                        className={styles.roomImg}
                        onError={(e) => { e.target.src = roomInfo.roomType === 'SINGLE' ? "/default-profile.svg" : "/default-room.svg"; }}
                    />
                </div>
                <h3 className={styles.title}>
                    {roomInfo.title || (roomInfo.roomType === 'SINGLE' ? roomInfo.otherMemberName : '그룹 채팅')}
                </h3>
                <div className={styles.actions}>
                    <button onClick={() => setShowSearch(!showSearch)} className={styles.actionBtn} title="검색">🔍</button>
                    <button onClick={() => setShowMemberModal(true)} className={styles.actionBtn}>설정</button>
                    <button onClick={handleLeave} className={styles.leaveBtn}>나가기</button>
                </div>
            </div>

            {/* ✨ Notice Banner */}
            {roomInfo.noticeContent && (
                <div className={styles.noticeBanner}>
                    <div className={styles.noticeContentWrapper}>
                        <span className={styles.noticeIcon}>📢</span>
                        <div className={styles.noticeTextContainer}>
                             <span className={styles.noticeText}>{roomInfo.noticeContent}</span>
                             {roomInfo.noticeSenderName && (
                                <span className={styles.noticeSender}> - {roomInfo.noticeSenderName}</span>
                             )}
                        </div>
                    </div>
                    <button onClick={handleClearNotice} className={styles.noticeCloseBtn} title="공지 내리기">✖</button>
                </div>
            )}

            {/* ✨ Search Bar */}
            {showSearch && (
                <div className={styles.searchBar}>
                    <input 
                        type="text"
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                        placeholder="메시지 검색..."
                        className={styles.searchInput}
                    />
                    <button onClick={handleSearch} className={styles.searchButton}>검색</button>
                    {searchResults.length > 0 && (
                        <>
                            <button onClick={handlePrevSearchResult} className={styles.navButton} title="이전">◀</button>
                            <span className={styles.searchCount}>
                                {searchResults.length - currentSearchIndex} / {searchOffset > searchResults.length ? searchOffset : searchResults.length}
                            </span>
                            <button onClick={handleNextSearchResult} className={styles.navButton} title="다음">▶</button>
                        </>
                    )}
                    <button onClick={handleCloseSearch} className={styles.closeSearchButton} title="닫기">✖</button>
                </div>
            )}


            {/* Message List */}
            <div className={styles.messageList}>
                <div ref={observerTarget} style={{ height: '10px' }} />
                {messages.map((msg, index) => {
                    const currentDate = new Date(msg.createdAt).toDateString();
                    const prevDate = index > 0 ? new Date(messages[index - 1].createdAt).toDateString() : null;
                    const isNewDate = currentDate !== prevDate;

                    return (
                        <React.Fragment key={msg.messageId || index}>
                            {isNewDate && (
                                <div className={styles.dateSeparator}>
                                    <span>
                                        {new Date(msg.createdAt).toLocaleDateString('ko-KR', { 
                                            year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' 
                                        })}
                                    </span>
                                </div>
                            )}
                            <div data-message-id={msg.messageId || msg.id}>
                                <MessageBubble 
                                    message={msg} 
                                    onReply={setReplyTo} 
                                    onSetNotice={handleSetNotice}
                                    isOwner={String(roomInfo.creatorId) === String(user.memberId)}
                                    onRefresh={handleRefresh}
                                    onImageLoad={handleImageLoad}
                                    isHighlighted={highlightedMessageId === (msg.messageId || msg.id)}
                                />
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputAreaWrapper}>
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

            {/* 프로필 모달 */}
            {showProfileModal && roomInfo.roomType === 'SINGLE' && (
                <UserDatailModal
                    isOpen={showProfileModal}
                    onClose={() => setShowProfileModal(false)}
                    memberId={roomInfo.otherMemberId}
                    zIndex={15000}
                />
            )}

            {/* Modals */}
            {showMemberModal && (
                <MemberManagementModal 
                    onClose={() => setShowMemberModal(false)}
                    roomId={roomId}
                    currentRoomTitle={roomInfo.title} 
                    currentRoomImage={roomInfo.roomImage}
                    roomType={roomInfo.roomType}
                    currentMembers={roomMembers}
                    currentUserId={user.memberId}
                    isOwner={String(roomInfo.creatorId) === String(user.memberId)}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                />
            )}
            
            <CustomModal
                isOpen={modalConfig.isOpen}
                onClose={modalConfig.onCancel}
                title={modalConfig.title}
                message={modalConfig.message}
                type={modalConfig.type}
                onConfirm={modalConfig.onConfirm}
                onCancel={modalConfig.onCancel}
                zIndex={12000}
            />
        </div>
    );
};

export default ChatRoomDetail;
