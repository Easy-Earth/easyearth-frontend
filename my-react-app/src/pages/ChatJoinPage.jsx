import React, { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { joinChatRoom } from '../apis/chatApi';

const ChatJoinPage = () => {
  const { roomId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const join = async () => {
      if (!user) {
        alert("로그인이 필요합니다.");
        navigate('/login');
        return;
      }

      try {
        await joinChatRoom(roomId, user.id);
        alert("채팅방에 참여했습니다!");
        navigate(`/chat/${roomId}`);
      } catch (error) {
        console.error("채팅방 참여 실패", error);
        alert("채팅방 참여 실패: " + (error.response?.data?.message || error.message));
        navigate('/chat');
      }
    };

    join();
  }, [roomId, user, navigate]);

  return (
    <div style={{ 
      textAlign: 'center', 
      marginTop: '100px',
      padding: '20px'
    }}>
      <h2>채팅방에 참여 중...</h2>
      <p>잠시만 기다려주세요.</p>
    </div>
  );
};

export default ChatJoinPage;
