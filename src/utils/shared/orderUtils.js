/**
 * Order Utilities
 * Centralized order validation and payload construction utilities
 * Eliminates duplicate validation logic across TradingPanel, ModifyOrderModal, ExitPositionModal
 */

import {
    ORDER_TYPES,
    PRODUCTS,
    ORDER_ACTIONS,
    FNO_EXCHANGES,
    PRICE_REQUIRED_ORDER_TYPES,
    TRIGGER_REQUIRED_ORDER_TYPES,
} from '../../constants/orderConstants';

// Import safe parse functions from centralized module (avoid duplication)
import { safeParseFloat, safeParseInt } from '../safeParse';

// Re-export for backward compatibility
export { safeParseFloat, safeParseInt };

/**
 * Validation result type
 * @typedef {Object} ValidationResult
 * @property {boolean} isValid - Whether the order is valid
 * @property {Object<string, string>} errors - Map of field name to error message
 */

/**
 * Normalize status string for comparison
 * Converts to uppercase and replaces spaces with underscores
 * @param {string} status - Status string to normalize
 * @returns {string} Normalized status
 */
export const normalizeStatus = (status) => {
    return (status || '').toUpperCase().replace(/\s+/g, '_');
};

/**
 * Check if exchange is F&O (requires lot size validation)
 * @param {string} exchange - Exchange code
 * @returns {boolean}
 */
export const isFnOExchange = (exchange) => {
    return FNO_EXCHANGES.includes(exchange);
};

/**
 * Validate order parameters
 * Centralizes all order validation logic used by TradingPanel, ModifyOrderModal, ExitPositionModal
 * 
 * @param {Object} order - Order parameters
 * @param {string} order.symbol - Trading symbol
 * @param {string} order.exchange - Exchange code
 * @param {string} order.action - BUY or SELL
 * @param {string|number} order.quantity - Order quantity
 * @param {string} order.orderType - Order type (MARKET, LIMIT, SL, SL-M)
 * @param {string|number} order.price - Limit price (required for LIMIT, SL)
 * @param {string|number} order.triggerPrice - Trigger price (required for SL, SL-M)
 * @param {number} [order.lotSize=1] - Lot size for F&O instruments
 * @returns {ValidationResult}
 */
export const validateOrder = ({
    symbol,
    exchange,
    action,
    quantity,
    orderType,
    price,
    triggerPrice,
    lotSize = 1,
}) => {
    const errors = {};

    // Symbol validation
    if (!symbol || symbol.trim() === '') {
        errors.symbol = 'Symbol is required';
    }

    // Action validation
    if (!action || !Object.values(ORDER_ACTIONS).includes(action)) {
        errors.action = 'Invalid action (must be BUY or SELL)';
    }

    // Quantity validation
    const qtyNum = safeParseInt(quantity, 0);
    if (qtyNum <= 0) {
        errors.quantity = 'Quantity must be greater than 0';
    }

    // Lot size validation for F&O instruments
    if (lotSize > 1 && qtyNum > 0 && qtyNum % lotSize !== 0) {
        errors.quantity = `Quantity must be a multiple of lot size (${lotSize})`;
    }

    // Price validation (for LIMIT and SL orders)
    if (PRICE_REQUIRED_ORDER_TYPES.includes(orderType)) {
        const priceNum = safeParseFloat(price, 0);
        if (priceNum <= 0) {
            errors.price = 'Price must be greater than 0';
        }
    }

    // Trigger price validation (for SL and SL-M orders)
    if (TRIGGER_REQUIRED_ORDER_TYPES.includes(orderType)) {
        const triggerNum = safeParseFloat(triggerPrice, 0);
        if (triggerNum <= 0) {
            errors.triggerPrice = 'Trigger price must be greater than 0';
        }
    }

    return {
        isValid: Object.keys(errors).length === 0,
        errors,
    };
};

/**
 * Create standardized order payload for API
 * Ensures consistent field naming and types
 * 
 * @param {Object} params - Order parameters
 * @returns {Object} Formatted order payload ready for API
 */
export const createOrderPayload = ({
    symbol,
    exchange = 'NSE',
    action,
    quantity,
    product = PRODUCTS.MIS,
    orderType = ORDER_TYPES.MARKET,
    price = 0,
    triggerPrice = 0,
    strategy = 'MANUAL',
    disclosedQuantity = 0,
    orderId = null,  // For modify orders
}) => {
    const payload = {
        symbol,
        exchange,
        action,
        quantity: safeParseInt(quantity),
        product,
        pricetype: orderType,
        price: orderType === ORDER_TYPES.MARKET ? 0 : safeParseFloat(price),
        trigger_price: TRIGGER_REQUIRED_ORDER_TYPES.includes(orderType)
            ? safeParseFloat(triggerPrice)
            : 0,
        strategy,
        disclosed_quantity: safeParseInt(disclosedQuantity),
    };

    // Add orderId for modify orders
    if (orderId) {
        payload.orderid = orderId;
    }

    return payload;
};

/**
 * Format quantity with lot size information
 * @param {number} qty - Quantity
 * @param {number} lotSize - Lot size
 * @returns {string} Formatted string like "100 (2L)" for 2 lots
 */
export const formatQuantityWithLots = (qty, lotSize = 1) => {
    const quantity = safeParseInt(qty, 0);
    if (lotSize > 1) {
        const lots = Math.floor(quantity / lotSize);
        return `${quantity} (${lots}L)`;
    }
    return String(quantity);
};

export default {
    validateOrder,
    createOrderPayload,
    safeParseFloat,
    safeParseInt,
    isFnOExchange,
    formatQuantityWithLots,
};
