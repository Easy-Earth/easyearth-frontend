import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearNotice, getChatRoomDetail, getChatRoomUsers, getMessages, leaveChatRoom, markAsRead, searchMessages, setNotice } from '../../apis/chatApi';
import { useAuth } from '../../context/AuthContext';
import { useChat } from '../../context/ChatContext';
import { useNotification } from '../../context/NotificationContext';
import { getFullUrl } from '../../utils/chatImageUtil';
import { extractOriginalFileName } from './chatFileUtil';
import MessageBubble from './MessageBubble';
import FileUploadButton from './FileUploadButton';
import MemberManagementModal from './MemberManagementModal';
import CustomModal from '../common/CustomModal';
import UserDatailModal from '../common/UserDatailModal';
import styles from './ChatRoomDetail.module.css';

const ChatRoomDetail = ({ roomId }) => {
    const { client, connected, loadChatRooms } = useChat();
    const { user } = useAuth();
    const { markNotificationsAsReadForRoom } = useNotification();
    const navigate = useNavigate();

    const [messages, setMessages] = useState([]);
    const isFirstLoad = useRef(true);
    const [input, setInput] = useState('');
    const [hasMore, setHasMoreState] = useState(true);
    const hasMoreRef = useRef(true); // 무한 스크롤 상태 Ref
    const messagesEndRef = useRef(null);
    const observerTarget = useRef(null);
    const prevScrollHeight = useRef(0);
    const chatInputRef = useRef(null); // 입력창 포커스 Ref

    // 방 변경 시 입력창 오토 포커스
    useEffect(() => {
        if (chatInputRef.current) {
            setTimeout(() => {
                chatInputRef.current.focus();
            }, 100);
        }
    }, [roomId]);

    const setHasMore = (val) => {
        hasMoreRef.current = val;
        setHasMoreState(val);
    };

    const [showMemberModal, setShowMemberModal] = useState(false);
    const [roomMembers, setRoomMembers] = useState([]);
    const [roomInfo, setRoomInfo] = useState({ title: '', type: 'SINGLE', members: [], creatorId: null, noticeContent: null, noticeMessageId: null, roomImage: null });

    const [replyTo, setReplyTo] = useState(null);
    // 알림 스택 상태
    const [incomingNotifications, setIncomingNotifications] = useState([]);
    const [outgoingNotifications, setOutgoingNotifications] = useState([]);

    // 알림 추가 (최대 3개, 5초 후 자동 삭제)
    const addNotification = (setter, message) => {
        const id = Date.now() + Math.random();
        const newNoti = { ...message, _id: id, closing: false };

        setter(prev => {
            const next = [...prev, newNoti];
            if (next.length > 3) next.shift(); // Keep max 3
            return next;
        });

        // Trigger Fade Out after 4.7s
        setTimeout(() => {
            setter(prev => prev.map(n => n._id === id ? { ...n, closing: true } : n));
        }, 4700);

        // Auto remove after 5s
        setTimeout(() => {
            setter(prev => prev.filter(n => n._id !== id));
        }, 5000);
    };

    const [modalConfig, setModalConfig] = useState({
        isOpen: false, title: "", message: "", type: "alert", onConfirm: null, onCancel: null
    });

    // 검색 관련 State
    const [showSearch, setShowSearch] = useState(false);
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(-1);
    const [highlightedMessageId, setHighlightedMessageId] = useState(null);
    const [searchOffset, setSearchOffset] = useState(0);
    const [hasMoreSearchResults, setHasMoreSearchResults] = useState(false);

    const [showProfileModal, setShowProfileModal] = useState(false);

    // 헤더 메뉴 State
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef(null);

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const closeModal = useCallback(() => {
        setModalConfig(prev => ({ ...prev, isOpen: false }));
        // 모달 닫힘 시 입력창 포커스 복귀
        if (chatInputRef.current) {
            chatInputRef.current.focus();
        }
    }, []);

    const showAlert = useCallback((message, title = "알림") => {
        setModalConfig({ isOpen: true, title, message, type: "alert", onConfirm: closeModal, onCancel: closeModal });
    }, [closeModal]);

    const showConfirm = useCallback((message, onConfirm, title = "확인") => {
        setModalConfig({ isOpen: true, title, message, type: "confirm", onConfirm: () => { onConfirm(); closeModal(); }, onCancel: closeModal });
    }, [closeModal]);

    const fetchRoomInfo = useCallback(async () => {
        try {
            const data = await getChatRoomDetail(roomId);
            console.log("🏠 Room Info Loaded:", data);
            setRoomInfo(data);
        } catch (error) {
            console.error("채팅방 정보 로드 실패", error);
            showAlert("채팅방 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.");
        }
    }, [roomId]);

    const fetchMessages = useCallback(async (cursorId) => {
        try {
            // 더 이상 로드할 메시지가 없으면 중단
            if (!hasMoreRef.current && cursorId !== 0) return;
            if (!user) return;

            const data = await getMessages(roomId, cursorId, user.memberId);

            if (data.length === 0) {
                setHasMore(false);
                return;
            }

            if (cursorId === 0) {
                // ✨ [Fix] localId 할당 logic
                const messagesWithLocalId = data.map(msg => ({ ...msg, localId: msg.messageId }));
                setMessages(messagesWithLocalId);
            } else {
                // 이전 스크롤 높이 저장 (위치 보정용)
                if (messagesContainerRef.current) {
                    prevScrollHeight.current = messagesContainerRef.current.scrollHeight;
                }
                const messagesWithLocalId = data.map(msg => ({ ...msg, localId: msg.messageId }));
                setMessages(prev => [...messagesWithLocalId, ...prev]);
            }

            if (data.length < 30) setHasMore(false);

        } catch (error) {
            console.error("메시지 로드 실패", error);
            showAlert("메시지를 불러올 수 없습니다. 페이지를 새로고침해주세요.");
        }
    }, [roomId, user?.memberId]);

    // 초기화 및 재연결 처리
    useEffect(() => {
        if (!connected || !roomId) return;

        console.log(`🔌 ChatRoomDetail: Connection Status Changed. Connected: ${connected}, RoomId: ${roomId}`);

        const initializeRoom = async () => {
            try {
                // 재연결 시에는 기존 메시지를 유지한 채로 최신 데이터를 가져옴 (깜빡임 방지)
                if (isFirstLoad.current) {
                    setMessages([]);
                    setHasMore(true);
                    setReplyTo(null);
                }

                // 읽음 처리 우선 실행
                await markAsRead(roomId, user.memberId, null);
                await fetchMessages(0);
                await fetchRoomInfo();
                loadChatRooms();

                isFirstLoad.current = false; // 초기화 완료
            } catch (error) {
                console.error("채팅방 초기화 실패", error);
            }
        };

        initializeRoom();
        markNotificationsAsReadForRoom(roomId);

        return () => {
            // Cleanup Logic
        };
    }, [roomId, connected]);

    // 방 변경 시 로딩 상태 초기화
    useEffect(() => {
        isFirstLoad.current = true;
    }, [roomId]);


    // 실시간 구독 (WebSocket)
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

            // 공지 업데이트 (메시지 목록에 추가하지 않음)
            if (receivedMsg.type === 'NOTICE_UPDATED') {
                console.log("📢 공지 업데이트 수신:", receivedMsg);
                setRoomInfo(prev => ({
                    ...prev,
                    noticeContent: receivedMsg.noticeContent,
                    noticeMessageId: receivedMsg.noticeMessageId,
                    noticeSenderName: receivedMsg.senderName
                }));
                return; // ✨ 중요: 여기서 종료하여 메시지로 추가되지 않도록 함
            }

            if (receivedMsg.type === 'NOTICE_CLEARED') {
                console.log("📢 공지 해제 수신:", receivedMsg);
                setRoomInfo(prev => ({
                    ...prev,
                    noticeContent: null,
                    noticeMessageId: null,
                    noticeSenderName: null
                }));
                return; // ✨ 중요: 여기서 종료
            }

            // 멤버 입장/퇴장 이벤트
            if (receivedMsg.type === 'MEMBER_UPDATE') {
                console.log("👥 멤버 업데이트 수신:", receivedMsg);
                fetchRoomInfo(); // 인원수 등 갱신
                // 멤버 목록 모달이 열려있다면 갱신
                if (showMemberModal) {
                    getChatRoomUsers(roomId).then(data => setRoomMembers(data));
                }
                return;
            }

            // Message handling
            setMessages(prev => {
                const receivedId = String(receivedMsg.messageId || receivedMsg.id);
                // 중복 체크 및 업데이트 로직
                const existingIndex = prev.findIndex(msg => String(msg.messageId || msg.id) === receivedId);

                // 내 메시지 매칭 (낙관적 업데이트 대체)
                let optimisticIndex = -1;
                if (receivedMsg.senderId === user.memberId) {
                    optimisticIndex = prev.findIndex(msg =>
                        msg.isOptimistic &&
                        msg.content === receivedMsg.content &&
                        msg.messageType === receivedMsg.messageType
                    );
                }

                let updatedMessages = [...prev];

                if (existingIndex !== -1) {
                    // 기존 메시지 업데이트 (localId 유지)
                    const existingMsg = updatedMessages[existingIndex];
                    updatedMessages[existingIndex] = { ...existingMsg, ...receivedMsg, localId: existingMsg.localId };
                } else if (optimisticIndex !== -1) {
                    // 낙관적 메시지를 실제 메시지로 교체
                    const optimisticMsg = updatedMessages[optimisticIndex];
                    updatedMessages[optimisticIndex] = { ...receivedMsg, localId: optimisticMsg.localId };
                } else {
                    // 새 메시지 (localId = messageId)
                    updatedMessages.push({ ...receivedMsg, localId: receivedMsg.messageId });
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

                // ✨ [Old Logic] Check if user is NOT at bottom
                if (!isUserAtBottomRef.current) {
                    console.log(" 새 메시지 도착 (스크롤 상단):", receivedMsg.content);
                    addNotification(setIncomingNotifications, receivedMsg);
                }
            } else {
                // 내가 보낸 메시지 알림 (스크롤 상단일 때)
                if (!isUserAtBottomRef.current) {
                    console.log("🔔 내 메시지 전송됨 (스크롤 상단):", receivedMsg.content);
                    addNotification(setOutgoingNotifications, receivedMsg);
                }
            }
            // Notice type handling logic removed/moved up
            if (receivedMsg.messageType === 'NOTICE' || receivedMsg.type === 'NOTICE') { fetchRoomInfo(); }
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
            }
        });

        // 에러 메시지 구독
        const userSubscription = client.subscribe(`/topic/user/${user.memberId}`, (message) => {
            try {
                const receivedMsg = JSON.parse(message.body);
                // 현재 채팅방 관련 에러인지 확인
                if (receivedMsg.messageType === 'ERROR' && String(receivedMsg.chatRoomId) === String(roomId)) { // ✨ [Fix] type -> messageType
                    console.error("❌ 채팅 오류 수신:", receivedMsg.content);
                    showAlert(receivedMsg.content, "전송 실패");

                    // 전송 실패 시 낙관적 메시지 롤백
                    setMessages(prev => {
                        const newMessages = [...prev];
                        // 뒤에서부터 검색하여 가장 최근의 낙관적 메시지를 찾음
                        for (let i = newMessages.length - 1; i >= 0; i--) {
                            if (newMessages[i].isOptimistic) {
                                console.log("🗑️ 전송 실패로 인한 낙관적 메시지 제거:", newMessages[i]);
                                newMessages.splice(i, 1);
                                break; // 하나만 제거
                            }
                        }
                        return newMessages;
                    });
                }
            } catch (e) {
                console.error("Error parsing user message", e);
            }
        });

        return () => {
            roomSubscription.unsubscribe();
            reactionSubscription.unsubscribe();
            readSubscription.unsubscribe();
            userSubscription.unsubscribe();
        };
    }, [roomId, client, connected, user?.memberId, showAlert]);


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

    // 스크롤 위치 감지 및 자동 스크롤
    const previousMessageCountRef = useRef(0);
    const messagesContainerRef = useRef(null);
    const isUserAtBottomRef = useRef(true);

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
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
            isUserAtBottomRef.current = isAtBottom;

            // 하단 도달 시 알림 해제
            if (isAtBottom) {
                setIncomingNotifications([]);
                setOutgoingNotifications([]);
            }
        };

        container.addEventListener('scroll', handleScroll);
        return () => container.removeEventListener('scroll', handleScroll);
    }, []);

    useEffect(() => {
        if (!messagesEndRef.current || messages.length === 0) return;

        // 첫 로드 시 스크롤 최하단 이동
        if (isFirstLoad.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'auto' });
            isFirstLoad.current = false;
            previousMessageCountRef.current = messages.length;
            isUserAtBottomRef.current = true;
            setIncomingNotifications([]);
            setOutgoingNotifications([]);
        }
        // 새 메시지 수신 시 하단 이동 (사용자가 하단에 있을 때만)
        else if (messages.length > previousMessageCountRef.current && isUserAtBottomRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
            previousMessageCountRef.current = messages.length;
        } else if (messages.length > previousMessageCountRef.current) {
            // 메시지 카운트는 업데이트하지만 스크롤은 하지 않음
            previousMessageCountRef.current = messages.length;
        }
        // 무한 스크롤로 과거 메시지 로드 시에는 스크롤 하지 않음
    }, [messages]);

    // 과거 메시지 로드 시 스크롤 위치 유지 (깜빡임 방지)
    useLayoutEffect(() => {
        if (prevScrollHeight.current > 0 && messagesContainerRef.current) {
            const container = messagesContainerRef.current;
            const currentScrollHeight = container.scrollHeight;
            const diff = currentScrollHeight - prevScrollHeight.current;

            if (diff > 0) {
                console.log(`📜 스크롤 보정: +${diff}px (과거 메시지 로드)`);
                container.scrollTop = diff; // 기존 스크롤 위치(0 근처) + 늘어난 높이
            }
            prevScrollHeight.current = 0; // Reset
        }
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        if (!connected) {
            showAlert("서버 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

        const msgDto = {
            chatRoomId: roomId,
            senderId: user.memberId,
            content: input,
            messageType: 'TEXT',
            parentMessageId: replyTo ? replyTo.messageId : null
        };

        // 1. 낙관적 업데이트 (임시 메시지 표출)
        const tempId = Date.now();
        const optimisticMsg = {
            ...msgDto,
            messageId: tempId,
            localId: tempId,
            senderName: user.name || "나",
            senderProfileImage: user.profileImage, // 현재 유저 프로필
            createdAt: new Date().toISOString(),
            isOptimistic: true,
            reactions: [],
            unreadCount: 0,

            // 답장 정보 포함
            parentMessageId: replyTo ? replyTo.messageId : null,
            parentMessageContent: replyTo ? replyTo.content : null,
            parentMessageSenderName: replyTo ? replyTo.senderName : null
        };

        setMessages(prev => [...prev, optimisticMsg]);

        // 2. 실제 전송
        try {
            client.publish({ destination: '/app/chat/message', body: JSON.stringify(msgDto) });
            setInput('');
            setReplyTo(null);
        } catch (error) {
            console.error("메시지 전송 실패", error);
            showAlert("메시지 전송에 실패했습니다.");
            // 실패 시 낙관적 메시지 제거 로직 추가 가능
            setMessages(prev => prev.filter(msg => msg.messageId !== tempId));
        }
    };

    const handleFileUpload = (fileUrl, type) => {
        if (!connected) {
            showAlert("서버 연결이 끊어졌습니다. 잠시 후 다시 시도해주세요.");
            return;
        }

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
                // 목록 갱신 후 이동
                await loadChatRooms();
                navigate('/chat');
            } catch (error) {
                console.error("채팅방 나가기 실패", error);
                showAlert(error.response?.data || "나가기에 실패했습니다.");
            }
        });
    };

    const handleKeyDown = (e) => {
        if (e.nativeEvent.isComposing) return; // 한글 조합 중 전송 방지
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

    const handleSetNotice = useCallback(async (message) => {
        try {
            await setNotice(roomId, user.memberId, message.messageId);
        } catch (error) {
            console.error("공지 설정 실패", error);
            showAlert("공지 설정에 실패했습니다.");
        }
    }, [roomId, user?.memberId, showAlert]);

    const handleClearNotice = useCallback(async () => {
        try {
            await clearNotice(roomId, user.memberId);
        } catch (error) {
            console.error("공지 해제 실패", error);
            showAlert("공지 해제에 실패했습니다.");
        }
    }, [roomId, user?.memberId, showAlert]);

    const handleRefresh = useCallback(() => { fetchRoomInfo(); fetchMessages(0); }, [fetchRoomInfo, fetchMessages]);

    // 이미지 로드 완료 시 스크롤 조정
    const handleImageLoad = useCallback(() => {
        if (isUserAtBottomRef.current) {
            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, []);

    // 검색 핸들러
    const searchInputRef = useRef(null);

    useEffect(() => {
        if (showSearch && searchInputRef.current) {
            searchInputRef.current.focus();
        }
    }, [showSearch]);

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
            setSearchOffset(results.length);
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
        scrollToMessage(messageId);
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
                        scrollToMessage(updatedResults[newIndex].messageId);
                    }, 100);
                }
            } catch (error) {
                console.error("추가 검색 실패", error);
            }
        } else if (newIndex < searchResults.length) {
            // 인덱스가 범위 내에 있으면 이동
            console.log('◀ Navigating to existing result at index:', newIndex);
            setCurrentSearchIndex(newIndex);
            scrollToMessage(searchResults[newIndex].messageId);
        }
    };

    // 메시지 스크롤 및 하이라이트 공통 함수
    const highlightTimeoutRef = useRef(null);

    const scrollToMessage = useCallback((messageId) => {
        console.log("📜 스크롤 시도: messageId =", messageId);

        if (highlightTimeoutRef.current) {
            clearTimeout(highlightTimeoutRef.current);
        }
        setHighlightedMessageId(messageId);

        // DOM 요소 찾기 (약간의 지연을 두어 렌더링 확보)
        setTimeout(() => {
            const element = document.querySelector(`[data-message-id="${messageId}"]`);

            if (element) {
                console.log("✅ 요소 찾음, 스크롤 실행");
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            } else {
                console.warn("❌ 메시지를 찾을 수 없습니다 (DOM 미존재):", messageId);
                showAlert("해당 메시지를 찾을 수 없습니다. (스크롤 위쪽에 있을 수 있습니다)");
            }
        }, 100);



        // 3초 후 하이라이트 해제
        highlightTimeoutRef.current = setTimeout(() => {
            setHighlightedMessageId(null);
            highlightTimeoutRef.current = null;
        }, 3000);
    }, [showAlert]);

    const handleNextSearchResult = () => {
        console.log('▶ Next button clicked, currentIndex:', currentSearchIndex);
        if (searchResults.length === 0) return;

        // 더 최근 결과로 이동 (인덱스 감소)
        if (currentSearchIndex > 0) {
            const newIndex = currentSearchIndex - 1;
            console.log('▶ Navigating to index:', newIndex);
            setCurrentSearchIndex(newIndex);
            scrollToMessage(searchResults[newIndex].messageId); // ✨ 공통 함수 사용
        } else {
            console.log('▶ Already at most recent result (index 0)');
        }
    };

    const handleCloseSearch = () => {
        setShowSearch(false);
        setSearchResults([]);
        setSearchKeyword('');
    };

    // 답장 메시지 클릭 시 이동
    const handleReplyClick = (targetMessageId) => {
        if (!targetMessageId) return;
        scrollToMessage(targetMessageId);
    };


    // 상대방 정보 추출 (1:1 채팅용)
    const getOtherMember = () => {
        if (roomInfo.roomType === 'SINGLE' && roomInfo.participants && user) {
            return roomInfo.participants.find(p => String(p.memberId) !== String(user.memberId));
        }
        return null;
    };

    const otherMember = getOtherMember();

    // 화면에 표시할 이미지 URL 결정
    const displayRoomImage = (() => {
        if (roomInfo.roomType === 'SINGLE') {
            // 1순위: participants에서 찾은 상대방 프사
            if (otherMember?.profileImageUrl) return getFullUrl(otherMember.profileImageUrl);
            // 2순위: roomInfo에 이미 있다면 사용 (목록 등에서 넘어온 경우)
            if (roomInfo.otherMemberProfile) return getFullUrl(roomInfo.otherMemberProfile);
            return "/default-profile.svg";
        } else {
            // GROUP
            return getFullUrl(roomInfo.roomImage) || "/default-room.svg";
        }
    })();

    // 화면에 표시할 제목 결정
    const displayTitle = (() => {
        if (roomInfo.title) return roomInfo.title;
        if (roomInfo.roomType === 'SINGLE') {
            return otherMember?.memberName || roomInfo.otherMemberName || "알 수 없는 대화방";
        }
        return "그룹 채팅";
    })();

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                {/* ✨ Header Image */}
                <div className={styles.headerImage}>
                    <img
                        src={displayRoomImage}
                        alt="Room"
                        className={styles.roomImg}
                        onError={(e) => { e.target.src = roomInfo.roomType === 'SINGLE' ? "/default-profile.svg" : "/default-room.svg"; }}
                    />
                </div>
                <h3 className={styles.title}>
                    {displayTitle}
                </h3>
                <div className={styles.actions} ref={menuRef}>
                    <button
                        className={`${styles.menuBtn} ${showMenu ? styles.active : ''}`}
                        onClick={() => setShowMenu(!showMenu)}
                        title="더보기"
                    >
                        ⋮
                    </button>

                    {showMenu && (
                        <div className={styles.dropdownMenu}>
                            <button
                                className={styles.menuItem}
                                onClick={() => {
                                    setShowSearch(!showSearch);
                                    setShowMenu(false);
                                    // ✨ 검색창 열리면 포커스 (useEffect로 처리되지만 명시적으로도 좋음)
                                    if (!showSearch) setTimeout(() => searchInputRef.current?.focus(), 100);
                                }}
                            >
                                <span>🔍</span> 메시지 검색
                            </button>

                            {roomInfo.roomType !== 'SINGLE' && (
                                <button
                                    className={styles.menuItem}
                                    onClick={() => {
                                        setShowMemberModal(true);
                                        setShowMenu(false);
                                    }}
                                >
                                    <span>⚙️</span> 채팅방 설정
                                </button>
                            )}

                            <button
                                className={`${styles.menuItem} ${styles.danger}`}
                                onClick={() => {
                                    handleLeave();
                                    setShowMenu(false);
                                }}
                            >
                                <span>🚪</span> 나가기
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* ✨ Notice Banner */}
            {roomInfo.noticeContent && (
                <div className={styles.noticeBanner}>
                    <div
                        className={styles.noticeContentWrapper}
                        onClick={() => scrollToMessage(roomInfo.noticeMessageId)} // ✨ Click handler added
                        title="공지 메시지로 이동"
                    >
                        <span className={styles.noticeIcon}>📢</span>
                        <div className={styles.noticeTextContainer}>
                            <span className={styles.noticeText}>{extractOriginalFileName(roomInfo.noticeContent)}</span>
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
                        ref={searchInputRef} // ✨ Ref 연결
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.nativeEvent.isComposing) handleSearch();
                        }}
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
                        <React.Fragment key={msg.localId || msg.messageId || index}>
                            {isNewDate && (
                                <div className={styles.dateSeparator}>
                                    <span>
                                        {(() => {
                                            try {
                                                const date = new Date(msg.createdAt);
                                                return isNaN(date.getTime())
                                                    ? ""
                                                    : date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
                                            } catch (e) {
                                                return "";
                                            }
                                        })()}
                                    </span>
                                </div>
                            )}
                            <div data-message-id={msg.messageId || msg.id}>
                                <MessageBubble
                                    message={msg}
                                    onReply={setReplyTo}
                                    onSetNotice={handleSetNotice}
                                    isOwner={roomInfo.roomType === 'SINGLE' || String(roomInfo.creatorId) === String(user.memberId)}
                                    onRefresh={handleRefresh}
                                    onImageLoad={handleImageLoad}
                                    isHighlighted={highlightedMessageId === (msg.messageId || msg.id)}
                                    // ✨ 하이라이트 여부 전달
                                    showAlert={showAlert} // Pass showAlert
                                    onReplyClick={scrollToMessage} // ✨ 답장 클릭 핸들러 전달
                                />
                            </div>
                        </React.Fragment>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputAreaWrapper}>
                {/* ✨ Stacked Incoming Notifications (Left) */}
                <div className={styles.notificationStackLeft}>
                    {incomingNotifications.map((noti) => (
                        <div
                            key={noti._id}
                            className={`${styles.newMessageNotification} ${noti.closing ? styles.fadeOut : ''}`}
                            onClick={() => {
                                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                setIncomingNotifications([]); // Clear all on click (or filter)
                            }}
                        >
                            <div className={styles.notificationContent}>
                                <span className={styles.notificationSender}>{noti.senderName}</span>
                                <span className={styles.notificationText}>
                                    {(noti.contentType === 'IMAGE' || noti.messageType === 'IMAGE') ? '사진' :
                                        (noti.contentType === 'FILE' || noti.messageType === 'FILE') ? extractOriginalFileName(noti.content) :
                                            noti.content}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* ✨ Stacked Outgoing Notifications (Right) */}
                <div className={styles.notificationStackRight}>
                    {outgoingNotifications.map((noti) => (
                        <div
                            key={noti._id}
                            className={`${styles.newMessageNotification} ${styles.myNotification} ${noti.closing ? styles.fadeOut : ''}`}
                            onClick={() => {
                                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                setOutgoingNotifications([]);
                            }}
                        >
                            <div className={styles.notificationContent}>
                                <span className={styles.notificationSender}>내 메시지</span>
                                <span className={styles.notificationText}>
                                    {(noti.contentType === 'IMAGE' || noti.messageType === 'IMAGE') ? '사진 보냄' :
                                        (noti.contentType === 'FILE' || noti.messageType === 'FILE') ? extractOriginalFileName(noti.content) :
                                            noti.content}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {replyTo && (
                    <div className={styles.replyBanner}>
                        <div className={styles.replyInfo}>
                            <span className={styles.replyToName}>To. {replyTo.senderName || "알 수 없음"}</span>
                            <span className={styles.replyToContent}>
                                {replyTo.content ? extractOriginalFileName(replyTo.content) : "내용 없음"}
                            </span>
                        </div>
                        <button onClick={() => setReplyTo(null)} className={styles.replyCloseBtn}>✖</button>
                    </div>
                )}

                <div className={styles.inputArea}>
                    <FileUploadButton onFileUploaded={handleFileUpload} showAlert={showAlert} />
                    <textarea
                        ref={chatInputRef} // ✨ Ref 연결
                        className={styles.input}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={replyTo ? `${replyTo.senderName}님에게 답장...` : "메시지를 입력하세요..."}
                        rows={1}
                    />
                    <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()}>
                        전송
                    </button>
                </div>
            </div>

            {/* 프로필 모달 */}
            {/* 프로필 모달 */}
            {showProfileModal && roomInfo.roomType === 'SINGLE' && (
                <UserDatailModal
                    isOpen={showProfileModal}
                    onClose={() => {
                        setShowProfileModal(false);
                        // ✨ 모달 닫힐 때 채팅 입력창으로 포커스 복귀
                        if (chatInputRef.current) chatInputRef.current.focus();
                    }}
                    memberId={roomInfo.otherMemberId}
                    zIndex={15000}
                />
            )}

            {/* Modals */}
            {showMemberModal && (
                <MemberManagementModal
                    onClose={() => {
                        setShowMemberModal(false);
                        // ✨ 모달 닫힐 때 채팅 입력창으로 포커스 복귀
                        if (chatInputRef.current) chatInputRef.current.focus();
                    }}
                    roomId={roomId}
                    currentRoomTitle={roomInfo.title}
                    currentRoomImage={roomInfo.roomImage}
                    roomType={roomInfo.roomType}
                    currentMembers={roomMembers}
                    currentUserId={user.memberId}
                    // ✨ [Fix] creatorId가 아니라 현재 멤버 목록에서 내 Role이 OWNER인지 확인
                    isOwner={roomMembers.find(m => String(m.memberId) === String(user.memberId))?.role === 'OWNER'}
                    showAlert={showAlert}
                    showConfirm={showConfirm}
                    onMemberUpdate={() => {
                        console.log("🔄 멤버 목록 갱신 요청");
                        getChatRoomUsers(roomId).then(data => setRoomMembers(data));
                    }}
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
