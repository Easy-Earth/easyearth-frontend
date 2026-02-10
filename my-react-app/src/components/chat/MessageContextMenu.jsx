import React, { useEffect, useRef } from 'react';
import styles from './MessageContextMenu.module.css';

const MessageContextMenu = ({ x, y, options, onClose, onReaction }) => {
    const menuRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                onClose();
            }
        };

        const handleScroll = () => onClose();

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('scroll', handleScroll, true);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [onClose]);

    // Screen boundary check
    const menuWidth = 200;
    const menuHeight = 120; // Estimated height for reactions + avg menu items
    
    let style = { top: y, left: x };
    
    // Prevent going off right edge
    if (x + menuWidth > window.innerWidth) {
        style.left = x - menuWidth;
    }
    
    // Prevent going off bottom edge
    if (y + menuHeight > window.innerHeight) {
        style.top = y - menuHeight;
    }
    
    // Ensure it doesn't go off top/left
    if (style.top < 0) style.top = 10;
    if (style.left < 0) style.left = 10;

    const emojis = ["❤️", "😂", "😢", "😡", "😲", "👍"];

    return (
        <div className={styles.contextMenu} style={style} ref={menuRef}>
            {/* ✨ Reaction Bar */}
            <div className={styles.reactionBar}>
                {emojis.map(emoji => (
                    <button 
                        key={emoji} 
                        className={styles.reactionBtn}
                        onClick={() => {
                            onReaction(emoji);
                            onClose();
                        }}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
            
            <div className={styles.divider} />

            {/* ✨ Menu Actions */}
            <div className={styles.menuList}>
                {options.map((option, index) => (
                    <div 
                        key={index} 
                        className={styles.menuItem} 
                        onClick={() => {
                            option.action();
                            onClose();
                        }}
                    >
                        {option.icon && <span className={styles.icon}>{option.icon}</span>}
                        {option.label}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default MessageContextMenu;
