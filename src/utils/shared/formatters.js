/**
 * Formatters Utility
 * Centralized formatting utilities for currency, numbers, percentages, and quantities
 * Eliminates 11+ duplicate formatCurrency implementations across components
 */

/**
 * Format currency value with locale-aware formatting
 * @param {number|string} value - Value to format
 * @param {object} options - Formatting options
 * @param {number} options.decimals - Number of decimal places (default: 2)
 * @param {string} options.locale - Locale for formatting (default: 'en-IN')
 * @param {boolean} options.showSymbol - Whether to show currency symbol (default: false)
 * @param {string} options.symbol - Currency symbol (default: '₹')
 * @returns {string} Formatted currency string
 */
export const formatCurrency = (value, options = {}) => {
    const {
        decimals = 2,
        locale = 'en-IN',
        showSymbol = false,
        symbol = '₹'
    } = options;

    if (value === null || value === undefined) return '0.00';

    const num = parseFloat(value);
    if (!Number.isFinite(num)) return '0.00';

    const formatted = num.toLocaleString(locale, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return showSymbol ? `${symbol}${formatted}` : formatted;
};

/**
 * Format P&L with color indication
 * @param {number} value - P&L value
 * @param {boolean} showSign - Show +/- sign
 * @returns {object} {text, color, className, value}
 */
export const formatPnL = (value, showSign = true) => {
    const num = parseFloat(value) || 0;
    const formatted = formatCurrency(Math.abs(num));
    const sign = num >= 0 ? '+' : '-';

    return {
        text: showSign ? `${sign}${formatted}` : formatted,
        color: num >= 0 ? 'var(--tv-color-up)' : 'var(--tv-color-down)',
        className: num >= 0 ? 'positive' : 'negative',
        value: num
    };
};

/**
 * Format percentage value
 * @param {number|string} value - Value to format
 * @param {number} decimals - Number of decimal places
 * @param {boolean} showSign - Whether to show +/- sign
 * @returns {string} Formatted percentage string
 */
export const formatPercent = (value, decimals = 2, showSign = false) => {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return '0.00%';

    const sign = showSign && num > 0 ? '+' : '';
    return `${sign}${num.toFixed(decimals)}%`;
};

/**
 * Format quantity with lot size information
 * @param {number} qty - Quantity
 * @param {number} lotSize - Lot size (default: 1)
 * @returns {string} Formatted string like "100 (2L)" for 2 lots
 */
export const formatQuantity = (qty, lotSize = 1) => {
    const quantity = parseInt(qty) || 0;
    if (lotSize > 1) {
        const lots = Math.floor(quantity / lotSize);
        return `${quantity} (${lots}L)`;
    }
    return String(quantity);
};

/**
 * Format price with appropriate decimal places
 * @param {number|string} price - Price to format
 * @param {number} decimals - Decimal places (default: 2)
 * @returns {string} Formatted price string
 */
export const formatPrice = (price, decimals = 2) => {
    const num = parseFloat(price);
    if (!Number.isFinite(num)) return '0.00';
    return num.toFixed(decimals);
};

/**
 * Format large numbers with K/L/Cr suffixes (Indian notation)
 * @param {number} value - Value to format
 * @param {number} decimals - Decimal places for suffix numbers
 * @returns {string} Formatted string like "1.5L" or "2.3Cr"
 */
export const formatCompactNumber = (value, decimals = 2) => {
    const num = parseFloat(value);
    if (!Number.isFinite(num)) return '0';

    const abs = Math.abs(num);
    const sign = num < 0 ? '-' : '';

    if (abs >= 10000000) {
        // Crores (1 Cr = 10,000,000)
        return `${sign}${(abs / 10000000).toFixed(decimals)}Cr`;
    } else if (abs >= 100000) {
        // Lakhs (1 L = 100,000)
        return `${sign}${(abs / 100000).toFixed(decimals)}L`;
    } else if (abs >= 1000) {
        // Thousands
        return `${sign}${(abs / 1000).toFixed(decimals)}K`;
    }

    return String(num);
};

/**
 * Format volume with compact notation
 * @param {number} volume - Volume to format
 * @returns {string} Formatted volume string
 */
export const formatVolume = (volume) => {
    return formatCompactNumber(volume, 1);
};

export default {
    formatCurrency,
    formatPnL,
    formatPercent,
    formatQuantity,
    formatPrice,
    formatCompactNumber,
    formatVolume,
};
