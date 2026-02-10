
import { useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './Modal.module.css';

//모달 컴포넌트

function Modal({
    isOpen,
    onClose,
    title,
    size = 'md',
    children,
    showCloseButton = true,
}){

    //모달창 ESC키로 닫기 
    const handleKeyDown = useCallback(
        (e)=>{
            if(e.key==='Escape')
                onClose();
        },[onClose]
    );


    //다른 위치 클릭으로 닫기
    const handleoverlayClick = (e) =>{
        if(e.target === e.currentTarget){
            onClose();
        }
    };

    //이벤트 리스너 등록
    useEffect(()=>{
        if (isOpen){
            document.addEventListener('keydown',handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return ()=> {
            document.removeEventListener('keydown',handleKeyDown); 
            document.body.style.overflow = '';
        }
    },[isOpen,handleKeyDown]);

    if(!isOpen) return null;

    return createPortal(
        <div className={styles.overlay} onClick={handleoverlayClick}>
            <div className={`${styles.modal} ${styles[size]}`} role='dialog' aria-modal='true'>
                {/*헤더 */}
                <div className={styles.header}>
                    <h2 className={styles.title}>{title}</h2>
                    {showCloseButton && (
                        <button type="button"
                                className={styles.closeButton}
                                onClick={onClose}
                                aria-label='닫기'
                                >
                            X
                        </button>
                    )}
                </div>

                {/* 본문 */}
                <div className={styles.body}>{children}</div>

            </div>
        </div>,
        document.body
        // createPortal은 document.body로 작성한 위치에 해당 내용을 랜더링시켜준다.
        // (첫번째 인자값이 랜더링 요소,두번째 인자값이 랜더링위치)
    );
}

export default Modal;