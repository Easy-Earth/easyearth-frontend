import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { joinChatRoom } from '../../apis/chatApi';
import CustomModal from '../../components/common/CustomModal';

const ChatJoinPage = () => {
    const { roomId } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [status, setStatus] = useState('JOINING'); // JOINING, SUCCESS, ERROR
    const [modalOpen, setModalOpen] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (!user) {
            // If not logged in, redirect to login (or show message) - App router handles this mostly via PrivateRoute, 
            // but just in case
            return;
        }

        const join = async () => {
            try {
                await joinChatRoom(roomId, user.memberId);
                // Success - redirect to chat room
                navigate(`/chat/${roomId}`);
            } catch (error) {
                console.error(error);
                setStatus('ERROR');
                // Check if already joined (server might return specific error code)
                // Assuming any error means "fail" or "already joined", user usually wants to go to chat anyway if exists
                // But let's show modal for safety
                setMessage(error?.response?.data || "채팅방 입장에 실패했습니다.");
                setModalOpen(true);
            }
        };

        join();
    }, [roomId, user, navigate]);

    return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '80vh',
            flexDirection: 'column'
        }}>
            <h2>채팅방 입장 중...</h2>
            {status === 'ERROR' && (
                <CustomModal
                    isOpen={modalOpen}
                    title="알림"
                    message={message}
                    onConfirm={() => navigate('/chat')}
                    onCancel={() => navigate('/chat')} // Go to chat list anyway
                />
            )}
        </div>
    );
};

export default ChatJoinPage;
