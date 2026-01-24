/**
 * useOrderFormState Hook
 * Consolidates order form state management for ModifyOrderModal and ExitPositionModal
 * Handles price, quantity, triggerPrice state with validation
 */

import { useState, useEffect, useCallback } from 'react';
import { validateOrder, createOrderPayload } from '../utils/shared/orderUtils';

/**
 * @typedef {Object} OrderFormState
 * @property {string} price - Limit price
 * @property {string} quantity - Order quantity
 * @property {string} triggerPrice - Trigger price for SL orders
 * @property {boolean} isSubmitting - Whether form is being submitted
 * @property {Object} errors - Validation errors
 */

/**
 * Custom hook for order form state management
 *
 * @param {Object} options - Hook options
 * @param {Object} options.initialData - Initial order data to pre-fill
 * @param {boolean} options.isOpen - Whether the modal is open
 * @param {Function} options.onSubmit - Submit handler function
 * @param {Function} options.onClose - Close handler function
 * @returns {Object} Form state and handlers
 */
const useOrderFormState = ({
    initialData = null,
    isOpen = false,
    onSubmit,
    onClose,
}) => {
    // Form state
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [triggerPrice, setTriggerPrice] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    // Pre-fill with initial data when modal opens or data changes
    useEffect(() => {
        if (isOpen && initialData) {
            setPrice(initialData.price || initialData.limit_price || '');
            setQuantity(initialData.quantity || '');
            setTriggerPrice(initialData.trigger_price || initialData.triggerprice || '');
            setErrors({});
        }
    }, [isOpen, initialData]);

    // Reset form when modal closes
    useEffect(() => {
        if (!isOpen) {
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Validate form inputs
    const validate = useCallback(() => {
        if (!initialData) {
            setErrors({ submit: 'No order data available' });
            return false;
        }

        const result = validateOrder({
            symbol: initialData.symbol,
            exchange: initialData.exchange,
            action: initialData.action,
            quantity,
            orderType: initialData.pricetype || initialData.order_type,
            price,
            triggerPrice,
            lotSize: initialData.lotSize || initialData.lot_size || 1,
        });

        setErrors(result.errors);
        return result.isValid;
    }, [initialData, quantity, price, triggerPrice]);

    // Handle form submission
    const handleSubmit = useCallback(async () => {
        if (!validate()) return;

        setIsSubmitting(true);
        setErrors({});

        try {
            const payload = createOrderPayload({
                symbol: initialData.symbol,
                exchange: initialData.exchange || 'NSE',
                action: initialData.action,
                quantity,
                product: initialData.product,
                orderType: initialData.pricetype || initialData.order_type,
                price,
                triggerPrice,
                strategy: initialData.strategy || 'MANUAL',
                disclosedQuantity: initialData.disclosed_quantity || 0,
                orderId: initialData.orderid || initialData.order_id,
            });

            await onSubmit(payload);
            onClose();
        } catch (error) {
            console.error('[useOrderFormState] Submit failed:', error);
            setErrors({ submit: error.message || 'Failed to submit order' });
        } finally {
            setIsSubmitting(false);
        }
    }, [initialData, quantity, price, triggerPrice, validate, onSubmit, onClose]);

    // Handle close (prevent close during submission)
    const handleClose = useCallback(() => {
        if (!isSubmitting) {
            setErrors({});
            onClose();
        }
    }, [isSubmitting, onClose]);

    // Clear a specific error
    const clearError = useCallback((field) => {
        setErrors(prev => {
            const next = { ...prev };
            delete next[field];
            return next;
        });
    }, []);

    // Calculate estimated value
    const estimatedValue = parseFloat(price || 0) * parseInt(quantity || 0);

    return {
        // State
        price,
        quantity,
        triggerPrice,
        isSubmitting,
        errors,
        estimatedValue,

        // Setters
        setPrice,
        setQuantity,
        setTriggerPrice,
        setErrors,

        // Handlers
        handleSubmit,
        handleClose,
        validate,
        clearError,
    };
};

export default useOrderFormState;
