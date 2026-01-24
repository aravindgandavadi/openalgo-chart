/**
 * BaseContextMenu - Reusable right-click context menu
 * 
 * Features:
 * - Portal rendering to body
 * - Auto-positioning to avoid screen edges
 * - Backdrop to close
 * - Menu items with icons
 * - Dividers between sections
 * - Danger variant for destructive actions
 */

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './BaseContextMenu.module.css';

/**
 * MenuItem - Individual menu item
 */
export const MenuItem = ({
    icon: Icon,
    label,
    onClick,
    danger = false,
    disabled = false,
    shortcut = null,
}) => (
    <button
        className={`${styles.menuItem} ${danger ? styles.danger : ''} ${disabled ? styles.disabled : ''}`}
        onClick={disabled ? undefined : onClick}
        disabled={disabled}
    >
        {Icon && <Icon size={14} className={styles.icon} />}
        <span className={styles.label}>{label}</span>
        {shortcut && <span className={styles.shortcut}>{shortcut}</span>}
    </button>
);

/**
 * MenuDivider - Separator between menu sections
 */
export const MenuDivider = () => <div className={styles.divider} />;

/**
 * MenuGroup - Group of menu items with optional label
 */
export const MenuGroup = ({ label, children }) => (
    <div className={styles.group}>
        {label && <div className={styles.groupLabel}>{label}</div>}
        {children}
    </div>
);

/**
 * BaseContextMenu - Main context menu component
 */
const BaseContextMenu = ({
    isVisible,
    position, // { x, y }
    onClose,
    children,
    width = 180,
}) => {
    const menuRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        if (!isVisible) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isVisible, onClose]);

    // Calculate position to avoid screen overflow
    const getMenuStyle = useCallback(() => {
        if (!position) return { left: 0, top: 0 };

        const menuHeight = 200; // Estimated max height
        const x = Math.min(position.x, window.innerWidth - width - 10);
        const y = Math.min(position.y, window.innerHeight - menuHeight - 10);

        return {
            left: Math.max(10, x),
            top: Math.max(10, y),
            minWidth: width,
        };
    }, [position, width]);

    if (!isVisible) return null;

    const menuContent = (
        <>
            {/* Backdrop to close menu */}
            <div className={styles.backdrop} onClick={onClose} />

            <div
                ref={menuRef}
                className={styles.menu}
                style={getMenuStyle()}
            >
                {children}
            </div>
        </>
    );

    return createPortal(menuContent, document.body);
};

export default BaseContextMenu;
