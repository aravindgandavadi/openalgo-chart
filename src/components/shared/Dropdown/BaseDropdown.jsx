/**
 * BaseDropdown - Reusable dropdown menu component
 * 
 * Features:
 * - Absolute positioning relative to trigger
 * - Click outside to close
 * - Items with icons, labels, active states
 * - Keyboard navigation (Escape to close)
 */

import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown } from 'lucide-react';
import styles from './BaseDropdown.module.css';

/**
 * DropdownItem - Individual dropdown option
 */
export const DropdownItem = ({
    icon: Icon,
    label,
    onClick,
    active = false,
    disabled = false,
    children,
}) => (
    <div
        className={`${styles.item} ${active ? styles.active : ''} ${disabled ? styles.disabled : ''}`}
        onClick={disabled ? undefined : onClick}
    >
        {Icon && (typeof Icon === 'function' ? <Icon size={16} className={styles.icon} /> : <span className={styles.icon}>{Icon}</span>)}
        {label && <span className={styles.label}>{label}</span>}
        {children}
    </div>
);

/**
 * DropdownDivider - Separator between sections
 */
export const DropdownDivider = () => <div className={styles.divider} />;

/**
 * BaseDropdown - Main dropdown component
 */
const BaseDropdown = ({
    isOpen,
    onClose,
    position, // { top, left } or { top, right }
    children,
    width = 180,
    className = '',
}) => {
    const dropdownRef = useRef(null);

    // Close on Escape
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        document.addEventListener('mousedown', handleClickOutside);

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const style = {
        ...position,
        minWidth: width,
    };

    return (
        <div
            ref={dropdownRef}
            className={`${styles.dropdown} ${className}`}
            style={style}
            onClick={(e) => e.stopPropagation()}
        >
            {children}
        </div>
    );
};

/**
 * DropdownTrigger - Wrapper with built-in trigger button
 */
export const DropdownWithTrigger = ({
    trigger,
    children,
    width = 180,
    align = 'left', // 'left' or 'right'
}) => {
    const [isOpen, setIsOpen] = React.useState(false);
    const triggerRef = useRef(null);
    const [position, setPosition] = React.useState({ top: 0, left: 0 });

    const handleToggle = useCallback(() => {
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 4,
                ...(align === 'right'
                    ? { right: window.innerWidth - rect.right }
                    : { left: rect.left }
                ),
            });
        }
        setIsOpen(!isOpen);
    }, [isOpen, align]);

    return (
        <>
            <div ref={triggerRef} onClick={handleToggle}>
                {trigger}
            </div>
            {isOpen && createPortal(
                <>
                    <div className={styles.backdrop} onClick={() => setIsOpen(false)} />
                    <BaseDropdown
                        isOpen={isOpen}
                        onClose={() => setIsOpen(false)}
                        position={position}
                        width={width}
                    >
                        {children}
                    </BaseDropdown>
                </>,
                document.body
            )}
        </>
    );
};

export default BaseDropdown;
