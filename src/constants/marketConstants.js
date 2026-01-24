/**
 * Market Constants
 * Centralized market timing constants and utilities
 * Used by: PositionTracker, Watchlist, and other components needing market status
 */

// Indian market timing constants (IST)
export const MARKET_HOURS = {
    NSE: {
        open: { hour: 9, minute: 15 },
        close: { hour: 15, minute: 30 },
    },
    BSE: {
        open: { hour: 9, minute: 15 },
        close: { hour: 15, minute: 30 },
    },
    NFO: {
        open: { hour: 9, minute: 15 },
        close: { hour: 15, minute: 30 },
    },
    MCX: {
        open: { hour: 9, minute: 0 },
        close: { hour: 23, minute: 30 },
    },
    CDS: {
        open: { hour: 9, minute: 0 },
        close: { hour: 17, minute: 0 },
    },
};

// Default market hours (for unspecified exchanges)
export const DEFAULT_MARKET_HOURS = {
    open: { hour: 9, minute: 15 },
    close: { hour: 15, minute: 30 },
};

// Shorthand for common use
export const MARKET_OPEN = DEFAULT_MARKET_HOURS.open;
export const MARKET_CLOSE = DEFAULT_MARKET_HOURS.close;

// Indian exchanges list
export const INDIAN_EXCHANGES = ['NSE', 'NSE_INDEX', 'BSE', 'NFO', 'MCX', 'CDS', 'BFO'];

// US exchanges list (for future use)
export const US_EXCHANGES = ['NYSE', 'NASDAQ', 'AMEX'];

/**
 * Get market hours for an exchange
 * @param {string} exchange - Exchange code
 * @returns {Object} { open: { hour, minute }, close: { hour, minute } }
 */
export const getMarketHours = (exchange) => {
    const normalizedExchange = (exchange || '').toUpperCase().replace('_INDEX', '');
    return MARKET_HOURS[normalizedExchange] || DEFAULT_MARKET_HOURS;
};

/**
 * Convert time to minutes from midnight
 * @param {number} hours - Hour (0-23)
 * @param {number} minutes - Minutes (0-59)
 * @returns {number} Minutes from midnight
 */
export const timeToMinutes = (hours, minutes) => hours * 60 + minutes;

/**
 * Check if market is currently open for an exchange
 * @param {string} [exchange='NSE'] - Exchange code
 * @param {Date} [date=new Date()] - Date to check (defaults to now)
 * @returns {boolean} Whether market is open
 */
export const isMarketOpen = (exchange = 'NSE', date = new Date()) => {
    const day = date.getDay();

    // Weekend check (Sunday = 0, Saturday = 6)
    if (day === 0 || day === 6) return false;

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = timeToMinutes(hours, minutes);

    const marketHours = getMarketHours(exchange);
    const openTime = timeToMinutes(marketHours.open.hour, marketHours.open.minute);
    const closeTime = timeToMinutes(marketHours.close.hour, marketHours.close.minute);

    return timeInMinutes >= openTime && timeInMinutes <= closeTime;
};

/**
 * Get current market status
 * @param {string} [exchange='NSE'] - Exchange code
 * @param {Date} [date=new Date()] - Date to check
 * @returns {Object} { isOpen: boolean, status: string }
 */
export const getMarketStatus = (exchange = 'NSE', date = new Date()) => {
    const day = date.getDay();

    // Weekend check
    if (day === 0 || day === 6) {
        return { isOpen: false, status: 'Weekend' };
    }

    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = timeToMinutes(hours, minutes);

    const marketHours = getMarketHours(exchange);
    const openTime = timeToMinutes(marketHours.open.hour, marketHours.open.minute);
    const closeTime = timeToMinutes(marketHours.close.hour, marketHours.close.minute);

    if (timeInMinutes >= openTime && timeInMinutes <= closeTime) {
        return { isOpen: true, status: 'Market Open' };
    } else if (timeInMinutes < openTime) {
        return { isOpen: false, status: 'Pre-Market' };
    } else {
        return { isOpen: false, status: 'Market Closed' };
    }
};

/**
 * Get time until market opens/closes in minutes
 * @param {string} [exchange='NSE'] - Exchange code
 * @param {Date} [date=new Date()] - Date to check
 * @returns {Object} { untilOpen: number, untilClose: number }
 */
export const getTimeUntilMarket = (exchange = 'NSE', date = new Date()) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const timeInMinutes = timeToMinutes(hours, minutes);

    const marketHours = getMarketHours(exchange);
    const openTime = timeToMinutes(marketHours.open.hour, marketHours.open.minute);
    const closeTime = timeToMinutes(marketHours.close.hour, marketHours.close.minute);

    return {
        untilOpen: openTime - timeInMinutes,
        untilClose: closeTime - timeInMinutes,
    };
};

/**
 * Format market hours as string
 * @param {string} [exchange='NSE'] - Exchange code
 * @returns {string} e.g., "9:15 AM - 3:30 PM"
 */
export const formatMarketHours = (exchange = 'NSE') => {
    const marketHours = getMarketHours(exchange);
    const formatTime = ({ hour, minute }) => {
        const h = hour > 12 ? hour - 12 : hour;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        return `${h}:${minute.toString().padStart(2, '0')} ${ampm}`;
    };
    return `${formatTime(marketHours.open)} - ${formatTime(marketHours.close)}`;
};

export default {
    MARKET_HOURS,
    DEFAULT_MARKET_HOURS,
    MARKET_OPEN,
    MARKET_CLOSE,
    INDIAN_EXCHANGES,
    US_EXCHANGES,
    getMarketHours,
    timeToMinutes,
    isMarketOpen,
    getMarketStatus,
    getTimeUntilMarket,
    formatMarketHours,
};
