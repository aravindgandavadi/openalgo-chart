/**
 * ModifyOrderModal Component
 * Modal for modifying pending orders
 */
import React, { useState, useEffect } from 'react';
import { validateOrder, createOrderPayload } from '../../../utils/shared/orderUtils';
import styles from '../AccountPanel.module.css';
import { formatCurrency } from '../utils/accountFormatters';
import { BaseModal } from '../../shared';

const ModifyOrderModal = ({ isOpen, order, onClose, onModifyComplete, showToast }) => {
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [isModifying, setIsModifying] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-fill with current order values
    useEffect(() => {
        if (order) {
            setPrice(order.price || '');
            setQuantity(order.quantity || '');
            setTriggerPrice(order.trigger_price || order.triggerprice || '');
            setErrors({});
        }
    }, [order]);

    // Validate inputs using centralized validation
    const validate = () => {
        const result = validateOrder({
            symbol: order?.symbol,
            exchange: order?.exchange,
            action: order?.action,
            quantity,
            orderType: order?.pricetype,
            price,
            triggerPrice,
            lotSize: order?.lotSize || 1,
        });
        setErrors(result.errors);
        return result.isValid;
    };

    const handleModify = async () => {
        if (!validate()) return;

        setIsModifying(true);
        try {
            // Use centralized payload creation for consistency
            const modifyPayload = createOrderPayload({
                symbol: order.symbol,
                exchange: order.exchange || 'NSE',
                action: order.action,
                quantity,
                product: order.product,
                orderType: order.pricetype,
                price,
                triggerPrice,
                strategy: order.strategy || 'MANUAL',
                disclosedQuantity: order.disclosed_quantity || 0,
                orderId: order.orderid,
            });

            await onModifyComplete(modifyPayload);
            onClose();
        } catch (error) {
            console.error('[ModifyOrderModal] Modify failed:', error);
            setErrors({ submit: error.message || 'Failed to modify order' });
        } finally {
            setIsModifying(false);
        }
    };

    const handleClose = () => {
        if (!isModifying) {
            setErrors({});
            onClose();
        }
    };

    if (!isOpen || !order) return null;

    // Calculate estimated value
    const estimatedValue = parseFloat(price || 0) * parseInt(quantity || 0);

    const footer = (
        <>
            <button
                className={styles.secondaryBtn}
                onClick={handleClose}
                disabled={isModifying}
            >
                Cancel
            </button>
            <button
                className={styles.primaryBtn}
                onClick={handleModify}
                disabled={isModifying}
            >
                {isModifying ? 'Modifying...' : 'Modify Order'}
            </button>
        </>
    );

    return (
        <BaseModal
            isOpen={isOpen}
            onClose={handleClose}
            title="Modify Order"
            footer={footer}
        >
            <div className={styles.modalBody}>
                {/* Order Details */}
                <div className={styles.orderDetails}>
                    <div className={styles.orderDetailRow}>
                        <span className={styles.orderDetailLabel}>Symbol:</span>
                        <span className={styles.orderDetailValue}>{order.symbol}</span>
                    </div>
                    <div className={styles.orderDetailRow}>
                        <span className={styles.orderDetailLabel}>Action:</span>
                        <span className={`${styles.orderDetailValue} ${order.action === 'BUY' ? styles.positive : styles.negative}`}>
                            {order.action}
                        </span>
                    </div>
                    <div className={styles.orderDetailRow}>
                        <span className={styles.orderDetailLabel}>Type:</span>
                        <span className={styles.orderDetailValue}>{order.pricetype}</span>
                    </div>
                    <div className={styles.orderDetailRow}>
                        <span className={styles.orderDetailLabel}>Product:</span>
                        <span className={styles.orderDetailValue}>{order.product}</span>
                    </div>
                </div>

                {/* Modification Form */}
                <div className={styles.modifyForm}>
                    {/* Quantity Input */}
                    <div className={styles.formGroup}>
                        <label htmlFor="quantity">
                            Quantity <span className={styles.required}>*</span>
                        </label>
                        <input
                            id="quantity"
                            type="number"
                            step="1"
                            min="1"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className={`${styles.formInput} ${errors.quantity ? styles.inputError : ''}`}
                            disabled={isModifying}
                        />
                        {errors.quantity && (
                            <span className={styles.errorText}>{errors.quantity}</span>
                        )}
                    </div>

                    {/* Price Input (not for MARKET orders) */}
                    {order.pricetype !== 'MARKET' && (
                        <div className={styles.formGroup}>
                            <label htmlFor="price">
                                {order.pricetype === 'SL' ? 'Limit Price' : 'Price'} <span className={styles.required}>*</span>
                            </label>
                            <input
                                id="price"
                                type="number"
                                step="0.05"
                                min="0"
                                value={price}
                                onChange={(e) => setPrice(e.target.value)}
                                className={`${styles.formInput} ${errors.price ? styles.inputError : ''}`}
                                disabled={isModifying}
                            />
                            {errors.price && (
                                <span className={styles.errorText}>{errors.price}</span>
                            )}
                        </div>
                    )}

                    {/* Trigger Price Input (for SL orders) */}
                    {(order.pricetype === 'SL' || order.pricetype === 'SL-M') && (
                        <div className={styles.formGroup}>
                            <label htmlFor="triggerPrice">
                                Trigger Price <span className={styles.required}>*</span>
                            </label>
                            <input
                                id="triggerPrice"
                                type="number"
                                step="0.05"
                                min="0"
                                value={triggerPrice}
                                onChange={(e) => setTriggerPrice(e.target.value)}
                                className={`${styles.formInput} ${errors.triggerPrice ? styles.inputError : ''}`}
                                disabled={isModifying}
                            />
                            {errors.triggerPrice && (
                                <span className={styles.errorText}>{errors.triggerPrice}</span>
                            )}
                        </div>
                    )}

                    {/* Estimated Value */}
                    {order.pricetype !== 'MARKET' && (
                        <div className={styles.estimatedValue}>
                            <span className={styles.estimatedLabel}>Estimated Value:</span>
                            <span className={styles.estimatedAmount}>₹{formatCurrency(estimatedValue)}</span>
                        </div>
                    )}
                </div>

                {/* Error Message */}
                {errors.submit && (
                    <div className={styles.errorMessage}>
                        {errors.submit}
                    </div>
                )}
            </div>
        </BaseModal>
    );
};

export default React.memo(ModifyOrderModal);
