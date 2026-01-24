/**
 * BaseDialog - Reusable confirmation/alert dialog
 * 
 * Built on top of BaseModal for consistent styling.
 * Features:
 * - Confirm/Cancel buttons
 * - Danger mode for destructive actions
 * - Enter key to confirm, Escape to cancel
 * - Alert mode (single OK button)
 */

import React, { useEffect, useCallback } from 'react';
import { AlertTriangle, Info, CheckCircle, XCircle } from 'lucide-react';
import BaseModal from '../Modal/BaseModal';
import styles from './BaseDialog.module.css';

const ICONS = {
    warning: AlertTriangle,
    info: Info,
    success: CheckCircle,
    error: XCircle,
    danger: AlertTriangle,
};

const BaseDialog = ({
    isOpen,
    title = 'Confirm',
    message,
    onConfirm,
    onCancel,
    // Optional props
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    danger = false,
    icon = null, // 'warning', 'info', 'success', 'error', 'danger'
    showCancel = true, // Set to false for alert-style dialogs
    loading = false,
    children = null, // Additional content between message and buttons
}) => {
    // Handle Enter key to confirm
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e) => {
            if (e.key === 'Enter' && !loading) {
                onConfirm?.();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, onConfirm, loading]);

    const IconComponent = icon ? ICONS[icon] : null;
    const iconColor = danger ? styles.iconDanger :
        icon === 'success' ? styles.iconSuccess :
            icon === 'error' ? styles.iconError :
                styles.iconDefault;

    const footer = (
        <>
            {showCancel && (
                <button
                    className={styles.cancelBtn}
                    onClick={onCancel}
                    disabled={loading}
                    type="button"
                >
                    {cancelText}
                </button>
            )}
            <button
                className={`${styles.confirmBtn} ${danger ? styles.danger : ''}`}
                onClick={onConfirm}
                disabled={loading}
                autoFocus
                type="button"
            >
                {loading ? 'Processing...' : confirmText}
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onCancel}
            title={title}
            size="small"
            footer={footer}
        >
            <div className={styles.content}>
                {IconComponent && (
                    <div className={`${styles.icon} ${iconColor}`}>
                        <IconComponent size={32} />
                    </div>
                )}
                {message && (
                    <p className={styles.message}>{message}</p>
                )}
                {children}
            </div>
        </BaseModal>
    );
};

export default BaseDialog;

/**
 * ConfirmDialog - Convenience alias for confirm dialogs
 */
export const ConfirmDialog = (props) => <BaseDialog {...props} />;

/**
 * AlertDialog - Single button alert dialog
 */
export const AlertDialog = ({ onClose, okText = 'OK', ...props }) => (
    <BaseDialog
        {...props}
        onConfirm={onClose}
        onCancel={onClose}
        confirmText={okText}
        showCancel={false}
    />
);

/**
 * DangerDialog - Destructive action confirmation
 */
export const DangerDialog = (props) => (
    <BaseDialog {...props} danger icon="danger" />
);
