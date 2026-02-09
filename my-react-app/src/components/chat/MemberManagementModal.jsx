import React, { useState, useEffect } from 'react';
import { searchMember, inviteUser, kickMember, updateRole } from '../../apis/chatApi';
import Modal from '../common/Modal'; // Using common Modal housing
import styles from './MemberManagementModal.module.css';

const MemberManagementModal = ({ onClose, roomId, currentMembers, currentUserId, isOwner, showAlert }) => {
    const [activeTab, setActiveTab] = useState('INVITE'); // 'INVITE' or 'MANAGE'
    const [searchValue, setSearchValue] = useState('');
    const [searchResult, setSearchResult] = useState(null);

    // Filter members for management list (exclude self)
    const otherMembers = currentMembers.filter(m => String(m.memberId) !== String(currentUserId));

    const handleSearch = async () => {
        if (!searchValue.trim()) return;
        try {
            const member = await searchMember(searchValue);
            if (member) {
                // Check if already in room
                const exists = currentMembers.some(m => String(m.memberId) === String(member.memberId));
                setSearchResult({ ...member, exists });
            } else {
                setSearchResult(null);
                showAlert("사용자를 찾을 수 없습니다.");
            }
        } catch (error) {
            console.error(error);
            showAlert("검색 중 오류가 발생했습니다.");
        }
    };

    const handleInvite = async () => {
        if (!searchResult) return;
        try {
            await inviteUser(roomId, searchResult.memberId, currentUserId);
            showAlert(`${searchResult.name}님을 초대했습니다.`);
            setSearchResult(null);
            setSearchValue('');
        } catch (error) {
            console.error(error);
            showAlert("초대 실패.");
        }
    };

    const handleKick = async (targetId, targetName) => {
        if (!window.confirm(`${targetName}님을 강퇴하시겠습니까?`)) return; // Should try to use CustomConfirm passed down if possible, but window.confirm for now or simple
        // Since we don't have a confirm callback easily here without prop drilling complexly, we'll assume CustomModal is used at parent level
        
        // For strict CustomModal usage, we would need to lift this state up or pass a showConfirm prop. 
        // Assuming showAlert handles alerts, we might need to skip confirm or implement a local one.
        // Let's implement immediate action for now or assume parent handles errors.
        
        try {
            await kickMember(roomId, targetId, currentUserId);
            showAlert(`${targetName}님을 강퇴했습니다.`);
            // Need to refresh member list in parent
        } catch (error) {
            console.error(error);
            showAlert("강퇴 실패.");
        }
    };

    return (
        <Modal
            isOpen={true}
            onClose={onClose}
            title="멤버 관리"
        >
            <div className={styles.tabs}>
                <button 
                    className={`${styles.tab} ${activeTab === 'INVITE' ? styles.active : ''}`}
                    onClick={() => setActiveTab('INVITE')}
                >
                    초대하기
                </button>
                <button 
                    className={`${styles.tab} ${activeTab === 'MANAGE' ? styles.active : ''}`}
                    onClick={() => setActiveTab('MANAGE')}
                >
                    멤버 목록 ({currentMembers.length})
                </button>
            </div>

            <div className={styles.content}>
                {activeTab === 'INVITE' && (
                    <div className={styles.inviteSection}>
                        <div className={styles.searchBox}>
                            <input 
                                type="text"
                                value={searchValue}
                                onChange={(e) => setSearchValue(e.target.value)}
                                placeholder="회원 ID 검색"
                                className={styles.input}
                            />
                            <button onClick={handleSearch} className={styles.searchBtn}>검색</button>
                        </div>
                        
                        {searchResult && (
                            <div className={styles.resultItem}>
                                <span>{searchResult.name} ({searchResult.loginId})</span>
                                {searchResult.exists ? (
                                    <span className={styles.existsBadge}>이미 참여중</span>
                                ) : (
                                    <button onClick={handleInvite} className={styles.inviteBtn}>초대</button>
                                )}
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'MANAGE' && (
                    <ul className={styles.memberList}>
                        {/* Me first */}
                        <li className={styles.memberItem}>
                            <div className={styles.memberInfo}>
                                <span className={styles.memberName}>{currentMembers.find(m => String(m.memberId) === String(currentUserId))?.name} (나)</span>
                                {isOwner && <span className={styles.roleBadge}>방장</span>}
                            </div>
                        </li>
                        
                        {/* Others */}
                        {otherMembers.map(member => (
                            <li key={member.memberId} className={styles.memberItem}>
                                <div className={styles.memberInfo}>
                                    <span className={styles.memberName}>{member.name}</span>
                                    {String(member.memberId) === String(currentUserId) ? null : (
                                        isOwner && (
                                            <button 
                                                className={styles.kickBtn}
                                                onClick={() => handleKick(member.memberId, member.name)}
                                            >
                                                강퇴
                                            </button>
                                        )
                                    )}
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            
            <div className={styles.footer}>
                <button className={styles.closeBtn} onClick={onClose}>닫기</button>
            </div>
        </Modal>
    );
};

export default MemberManagementModal;
