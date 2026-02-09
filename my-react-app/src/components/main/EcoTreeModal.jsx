import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getEcoTreeInfo, growEcoTree } from '../../apis/ecotreeApi';
import styles from './EcoTreeModal.module.css';

// 이미지 import
import stage1 from '../../assets/ecotree/stage1.png';
import stage2 from '../../assets/ecotree/stage2.png';
import stage3 from '../../assets/ecotree/stage3.png';
import stage4 from '../../assets/ecotree/stage4.png';

const EcoTreeModal = ({ isOpen, onClose }) => {
    const { user } = useAuth();
    const [tree, setTree] = useState(null);
    const [loading, setLoading] = useState(false);
    const [growing, setGrowing] = useState(false);
    const [error, setError] = useState(null);

    // 성장 임계치 (백엔드와 동일하게 설정)
    const MAX_EXP = 3780000;
    const stages = [
        { level: 1, name: '씨앗 (새싹)', threshold: 0, img: stage1 },
        { level: 2, name: '어린 나무', threshold: 500000, img: stage2 },
        { level: 3, name: '큰 나무', threshold: 1500000, img: stage3 },
        { level: 4, name: '울창한 열매 전설', threshold: 3780000, img: stage4 },
    ];

    useEffect(() => {
        if (isOpen && user?.memberId) {
            fetchTreeInfo();
        }
    }, [isOpen, user?.memberId]);

    const fetchTreeInfo = async () => {
        setLoading(true);
        try {
            const data = await getEcoTreeInfo(user.memberId);
            setTree(data);
            setError(null);
        } catch (err) {
            setError('나무 정보를 불러오지 못했어요.');
        } finally {
            setLoading(false);
        }
    };

    const handleGrow = async () => {
        if (growing || !user?.memberId) return;

        const availableAmount = tree.totalEarnedPoint - tree.syncedExp;
        if (availableAmount <= 0) {
            alert('아직 나무를 성장시킬 에너지가 부족해요! 퀘스트와 출석으로 포인트를 모아보세요.');
            return;
        }

        setGrowing(true);
        try {
            const data = await growEcoTree(user.memberId);
            setTree(data);
            // 성공 애니메이션을 위한 딜레이
            setTimeout(() => {
                setGrowing(false);
            }, 800);
        } catch (err) {
            alert('성장 과정에서 오류가 발생했어요.');
            setGrowing(false);
        }
    };

    if (!isOpen) return null;

    const currentStage = stages.find(s => s.level === tree?.treeLevel) || stages[0];
    const nextStage = stages.find(s => s.level === (tree?.treeLevel || 1) + 1);

    // 진행률 계산
    const progress = Math.min((tree?.syncedExp || 0) / MAX_EXP * 100, 100);
    const availableAmount = tree ? tree.totalEarnedPoint - tree.syncedExp : 0;

    return (
        <div className={styles.modalOverlay} onClick={onClose}>
            <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                <button className={styles.closeBtn} onClick={onClose}>&times;</button>

                <h2 className={styles.title}>🌱 에코트리 성장 게임</h2>

                {loading ? (
                    <div className={styles.loading}>정보를 불러오는 중...</div>
                ) : error ? (
                    <div className={styles.error}>{error}</div>
                ) : tree && (
                    <>
                        <div className={styles.treeDisplay}>
                            <div className={styles.growthEffect}></div>
                            <img
                                src={currentStage.img}
                                alt="Eco Tree"
                                className={`${styles.treeImage} ${growing ? styles.growingAnim : ''}`}
                            />
                        </div>

                        <div className={styles.statsContainer}>
                            <div className={styles.levelBadge}>LV.{tree.treeLevel} {currentStage.name}</div>

                            <div className={styles.progressLabel}>
                                <span>성장 진행도</span>
                                <span>{progress.toFixed(1)}%</span>
                            </div>
                            <div className={styles.progressBar}>
                                <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
                            </div>

                            <p className={styles.pointInfo}>
                                반영 가능한 누적 포인트: <span className={styles.pointValue}>{availableAmount.toLocaleString()} P</span>
                            </p>

                            <button
                                className={styles.growBtn}
                                onClick={handleGrow}
                                disabled={growing || availableAmount <= 0}
                            >
                                {growing ? '🌟 성장 에너지를 주입 중...' : '🌲 나무에게 에너지 주기 (성장)'}
                            </button>
                        </div>

                        <p className={styles.desc}>
                            회원님이 지구를 아끼며 모은 <b>총 누적 포인트</b>가 나무의 에너지가 됩니다!<br />
                            완전한 전설의 나무가 되기까지 약 6개월의 정성이 필요해요.
                        </p>
                    </>
                )}
            </div>
        </div>
    );
};

export default EcoTreeModal;
