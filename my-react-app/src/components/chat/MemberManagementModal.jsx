import React, { useState, useEffect } from 'react';
import { getChatRoomDetail, kickMember, updateRole, searchMember, joinChatRoom } from '../../apis/chatApi';
import styles from './MemberManagementModal.module.css';

const MemberManagementModal = ({ roomId, currentUser, onClose, onUpdate }) => {
  const [members, setMembers] = useState([]);
  const [currentUserRole, setCurrentUserRole] = useState('MEMBER');
  const [loading, setLoading] = useState(true);
  
  // 멤버 초대 관련 state
  const [showInviteSection, setShowInviteSection] = useState(false);
  const [searchLoginId, setSearchLoginId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    loadMembers();
  }, [roomId]);

  const loadMembers = async () => {
    try {
      setLoading(true);
      const roomData = await getChatRoomDetail(roomId);
      setMembers(roomData.participants || []);
      
      // 현재 사용자 권한 확인
      const myData = roomData.participants?.find(p => p.memberId === currentUser.id);
      if (myData) {
        setCurrentUserRole(myData.role);
      } else if (roomData.participants && roomData.participants.length === 0) {
        // 참여자가 없는 경우 (1:1 채팅 등) 기본적으로 초대 권한 부여
        setCurrentUserRole('OWNER');
      } else {
        // 목록에는 있지만 본인이 없는 경우 MEMBER로 설정
        setCurrentUserRole('MEMBER');
      }
    } catch (error) {
      console.error("멤버 목록 로드 실패", error);
      // 에러 발생 시에도 기본 권한 부여 (채팅방 접근 가능하다면)
      setCurrentUserRole('OWNER');
    } finally {
      setLoading(false);
    }
  };

  const handleKick = async (targetMemberId, memberName) => {
    if (!window.confirm(`${memberName}님을 강퇴하시겠습니까?`)) return;
    
    try {
      await kickMember(roomId, targetMemberId, currentUser.id);
      alert("멤버를 강퇴했습니다.");
      await loadMembers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("강퇴 실패", error);
      alert("강퇴 실패: " + (error.response?.data?.message || error.message));
    }
  };

  const handleRoleChange = async (targetMemberId, memberName, newRole) => {
    const roleNames = {
      OWNER: '방장',
      ADMIN: '관리자',
      MEMBER: '멤버'
    };
    
    if (!window.confirm(`${memberName}님을 ${roleNames[newRole]}로 변경하시겠습니까?`)) return;
    
    try {
      await updateRole(roomId, targetMemberId, currentUser.id, newRole);
      alert("권한이 변경되었습니다.");
      await loadMembers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("권한 변경 실패", error);
      alert("권한 변경 실패: " + (error.response?.data?.message || error.message));
    }
  };

  // 사용자 검색
  const handleSearchMember = async () => {
    if (!searchLoginId.trim()) {
      alert("로그인 ID를 입력하세요.");
      return;
    }

    try {
      setSearching(true);
      const result = await searchMember(searchLoginId);
      
      if (result) {
        // 이미 참여 중인지 확인
        const alreadyMember = members.some(m => m.memberId === result.memberId);
        if (alreadyMember) {
          alert("이미 채팅방에 참여 중인 멤버입니다.");
          setSearchResult(null);
        } else {
          setSearchResult(result);
        }
      } else {
        alert("사용자를 찾을 수 없습니다.");
        setSearchResult(null);
      }
    } catch (error) {
      console.error("사용자 검색 실패", error);
      alert("사용자 검색 실패");
      setSearchResult(null);
    } finally {
      setSearching(false);
    }
  };

  // 멤버 초대
  const handleInviteMember = async () => {
    if (!searchResult) return;

    if (!window.confirm(`${searchResult.name}님을 초대하시겠습니까?`)) return;

    try {
      await joinChatRoom(roomId, searchResult.memberId);
      alert(`${searchResult.name}님을 초대했습니다.`);
      setSearchLoginId('');
      setSearchResult(null);
      setShowInviteSection(false);
      await loadMembers();
      if (onUpdate) onUpdate();
    } catch (error) {
      console.error("멤버 초대 실패", error);
      alert("멤버 초대 실패: " + (error.response?.data?.message || error.message));
    }
  };

  const isOwner = currentUserRole === 'OWNER';
  const isAdmin = currentUserRole === 'ADMIN';

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>참여자 관리 ({members.length}명)</h3>
        
        {/* 멤버 초대 버튼 */}
        {(isOwner || isAdmin) && (
          <button 
            onClick={() => setShowInviteSection(!showInviteSection)} 
            className={styles.inviteBtn}
          >
            {showInviteSection ? '초대 취소' : '+ 멤버 초대'}
          </button>
        )}

        {/* 멤버 초대 섹션 */}
        {showInviteSection && (
          <div className={styles.inviteSection}>
            <div className={styles.searchBox}>
              <input
                type="text"
                placeholder="초대할 사용자 ID 입력"
                value={searchLoginId}
                onChange={(e) => setSearchLoginId(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearchMember()}
                className={styles.searchInput}
              />
              <button 
                onClick={handleSearchMember} 
                disabled={searching}
                className={styles.searchBtn}
              >
                {searching ? '검색중...' : '검색'}
              </button>
            </div>

            {searchResult && (
              <div className={styles.searchResult}>
                <div className={styles.resultInfo}>
                  <span className={styles.resultName}>{searchResult.name}</span>
                  <span className={styles.resultId}>@{searchResult.loginId}</span>
                </div>
                <button onClick={handleInviteMember} className={styles.inviteConfirmBtn}>
                  초대하기
                </button>
              </div>
            )}
          </div>
        )}
        
        {loading ? (
          <div className={styles.loading}>로딩 중...</div>
        ) : (
          <div className={styles.memberList}>
            {members.map(member => (
              <div key={member.memberId} className={styles.memberItem}>
                <div className={styles.memberInfo}>
                  <span className={styles.memberName}>{member.memberName || member.name}</span>
                  <span className={styles.memberRole}>
                    {member.role === 'OWNER' && '👑 방장'}
                    {member.role === 'ADMIN' && '⭐ 관리자'}
                    {member.role === 'MEMBER' && '멤버'}
                  </span>
                </div>
                
                {isOwner && member.memberId !== currentUser.id && (
                  <div className={styles.actions}>
                    <select
                      value={member.role}
                      onChange={(e) => handleRoleChange(member.memberId, member.memberName || member.name, e.target.value)}
                      className={styles.roleSelect}
                    >
                      <option value="MEMBER">멤버</option>
                      <option value="ADMIN">관리자</option>
                      <option value="OWNER">방장</option>
                    </select>
                    
                    <button
                      onClick={() => handleKick(member.memberId, member.memberName || member.name)}
                      className={styles.kickBtn}
                    >
                      강퇴
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
        
        <button onClick={onClose} className={styles.closeBtn}>닫기</button>
      </div>
    </div>
  );
};

export default MemberManagementModal;
