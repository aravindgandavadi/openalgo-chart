import React from 'react';
import styles from './OrderEntryModal.module.css';
import TradingPanel from '../TradingPanel/TradingPanel';
import { BaseModal } from '../shared';

const OrderEntryModal = ({
    isOpen,
    onClose,
    symbol,
    exchange,
    showToast,
    initialAction,
    initialPrice,
    initialOrderType
}) => {
    // Esc key handled by BaseModal

    if (!isOpen) return null;

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={onClose}
            showHeader={false}
            noPadding={true}
            size="small"
        >
            <TradingPanel
                symbol={symbol}
                exchange={exchange}
                isOpen={true}
                onClose={onClose}
                showToast={showToast}
                initialAction={initialAction}
                initialPrice={initialPrice}
                initialOrderType={initialOrderType}
            />
        </BaseModal>
    );
};

export default OrderEntryModal;
