import React, { useState, useEffect, useRef } from 'react';
import { useChat } from '../../context/ChatContext';
import { useAuth } from '../../context/AuthContext';
import { getMessages, markAsRead, leaveChatRoom, updateRole, kickMember, getChatRoomUsers } from '../../apis/chatApi';
import MessageBubble from './MessageBubble';
import FileUploadButton from './FileUploadButton';
import MemberManagementModal from './MemberManagementModal';
import CustomModal from '../common/CustomModal';
import styles from './ChatRoomDetail.module.css';
import { useNavigate } from 'react-router-dom';

const ChatRoomDetail = ({ roomId }) => {
    const { client, connected, loadChatRooms } = useChat();
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);
    const messagesEndRef = useRef(null);
    const observerTarget = useRef(null); // For infinite scroll detection
    
    const [showMemberModal, setShowMemberModal] = useState(false);
    const [roomMembers, setRoomMembers] = useState([]);
    const [roomInfo, setRoomInfo] = useState({ title: '', type: 'SINGLE', members: [], creatorId: null });

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

    // 1. 메시지 로드 및 구독 설정
    useEffect(() => {
        if (!client || !connected || !roomId) return;

        // Reset
        setMessages([]);
        setPage(0);
        setHasMore(true);

        // Fetch initial messages
        fetchMessages(0);

        // Subscribe to room topic
        const roomSubscription = client.subscribe(`/topic/chat/room/${roomId}`, (message) => {
            const receivedMsg = JSON.parse(message.body);
            setMessages(prev => [...prev, receivedMsg]);
            
            // If it's a message I didn't send, mark as read immediately if window focused
            if (receivedMsg.senderId !== user.memberId) {
                markAsRead(roomId, user.memberId, receivedMsg.id);
            }
        });

        // Subscribe to read updates
        const readSubscription = client.subscribe(`/topic/chat/room/${roomId}/read`, (message) => {
            const readEvent = JSON.parse(message.body);
            if (readEvent.type === 'READ_UPDATE') {
                setMessages(prev => prev.map(msg => {
                    if (readEvent.unreadCountMap && readEvent.unreadCountMap[msg.id] !== undefined) {
                        return { ...msg, unreadCount: readEvent.unreadCountMap[msg.id] };
                    }
                    return msg;
                }));
            }
        });

        return () => {
            roomSubscription.unsubscribe();
            readSubscription.unsubscribe();
        };
    }, [roomId, client, connected]);

    // 2. 메시지 가져오기
    const fetchMessages = async (cursorId) => {
        try {
            const data = await getMessages(roomId, cursorId, user.memberId); // API adjusted for simplicity
            // Assuming API returns { content: [], lastId: ... } or just list
            // If just list:
            if (Array.isArray(data)) {
                if (data.length === 0) setHasMore(false);
                setMessages(prev => cursorId === 0 ? data.reverse() : [...data.reverse(), ...prev]);
            }
        } catch (error) {
            console.error("메시지 로드 실패", error);
        }
    };

    // 3. 스크롤 하단 고정 (새 메시지 왔을 때)
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = () => {
        if (!input.trim()) return;
        
        const message = {
            chatRoomId: roomId,
            senderId: user.memberId,
            content: input,
            contentType: 'TEXT' // DTO field name might be messageType? Let's check DTO. DTO has messageType, not contentType.
        };

        // WARNING: frontend sends 'contentType' but backend DTO has 'messageType'.
        // Let's fix this property name too if the backend DTO uses 'messageType'.
        // Checking ChatController: public void sendMessage(ChatMessageDto messageDto)
        // ChatMessageDto has private String messageType;
        // So we must send 'messageType'.

        client.publish({
            destination: '/app/chat/message',
            body: JSON.stringify({ ...message, messageType: 'TEXT' }) // Send both to be safe or just correct one
        });

        setInput('');
    };

    const handleFileUpload = (fileUrl, type) => {
        const message = {
            chatRoomId: roomId,
            senderId: user.memberId,
            content: fileUrl,
            contentType: type // 'IMAGE' or 'FILE'
        };
        
        client.publish({
            destination: '/app/chat/message',
            body: JSON.stringify({ ...message, messageType: type })
        });
    };

    const handleLeave = () => {
        showConfirm("채팅방을 나가시겠습니까?", async () => {
            try {
                await leaveChatRoom(roomId, user.memberId);
                loadChatRooms(); // ChatContext refresh
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

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <h3 className={styles.title}>대화방</h3>
                <div className={styles.actions}>
                    <button onClick={() => setShowMemberModal(true)} className={styles.actionBtn}>멤버</button>
                    <button onClick={handleLeave} className={styles.leaveBtn}>나가기</button>
                </div>
            </div>

            {/* Message List */}
            <div className={styles.messageList}>
                {messages.map((msg, index) => (
                    <MessageBubble key={msg.id || index} message={msg} />
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className={styles.inputArea}>
                <FileUploadButton onFileUploaded={handleFileUpload} />
                <textarea 
                    className={styles.input}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="메시지를 입력하세요..."
                    rows={1}
                />
                <button className={styles.sendBtn} onClick={handleSend} disabled={!input.trim()}>
                    전송
                </button>
            </div>

            {/* Modals */}
            {showMemberModal && (
                <MemberManagementModal 
                    onClose={() => setShowMemberModal(false)}
                    roomId={roomId}
                    currentMembers={roomMembers}
                    currentUserId={user.memberId}
                    isOwner={false} // Logic needed to check ownership
                    showAlert={showAlert}
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
