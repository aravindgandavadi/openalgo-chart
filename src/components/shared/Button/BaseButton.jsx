/**
 * BaseButton - Reusable button component with variants
 * 
 * Variants:
 * - primary: Blue accent button
 * - secondary: Neutral/ghost button
 * - danger: Red destructive action
 * - buy: Green trading buy button
 * - sell: Red trading sell button
 * 
 * Sizes: small, medium, large
 */

import React from 'react';
import styles from './BaseButton.module.css';

const BaseButton = ({
    children,
    variant = 'primary', // 'primary', 'secondary', 'danger', 'buy', 'sell', 'ghost'
    size = 'medium', // 'small', 'medium', 'large'
    disabled = false,
    loading = false,
    fullWidth = false,
    icon: Icon = null,
    iconPosition = 'left',
    type = 'button',
    className = '',
    onClick,
    ...props
}) => {
    const variantClass = styles[variant] || styles.primary;
    const sizeClass = styles[size] || styles.medium;

    const buttonClasses = [
        styles.button,
        variantClass,
        sizeClass,
        fullWidth ? styles.fullWidth : '',
        loading ? styles.loading : '',
        className,
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClasses}
            disabled={disabled || loading}
            onClick={onClick}
            {...props}
        >
            {loading && <span className={styles.spinner} />}
            {Icon && iconPosition === 'left' && !loading && (
                <Icon size={size === 'small' ? 14 : size === 'large' ? 18 : 16} className={styles.icon} />
            )}
            {children && <span className={styles.label}>{children}</span>}
            {Icon && iconPosition === 'right' && !loading && (
                <Icon size={size === 'small' ? 14 : size === 'large' ? 18 : 16} className={styles.icon} />
            )}
        </button>
    );
};

/**
 * IconButton - Button with only an icon (no text)
 */
export const IconButton = ({
    icon: Icon,
    size = 'medium',
    variant = 'ghost',
    tooltip,
    className = '',
    ...props
}) => {
    const iconSize = size === 'small' ? 16 : size === 'large' ? 22 : 18;

    return (
        <button
            type="button"
            className={`${styles.iconButton} ${styles[variant]} ${styles[size]} ${className}`}
            title={tooltip}
            {...props}
        >
            <Icon size={iconSize} />
        </button>
    );
};

/**
 * ButtonGroup - Container for grouped buttons
 */
export const ButtonGroup = ({ children, className = '' }) => (
    <div className={`${styles.buttonGroup} ${className}`}>
        {children}
    </div>
);

export default BaseButton;
