/**
 * Account Service
 * Trading account operations - funds, positions, orders, holdings
 *
 * Uses centralized apiHelper to reduce boilerplate
 */

import { makeApiRequest } from './apiHelper';

/**
 * Ping API - Check connectivity and validate API key
 * @returns {Promise<Object|null>} { broker, message } on success, null on error
 */
export const ping = async () => {
    return makeApiRequest('/ping', {}, {
        context: 'Ping',
        defaultValue: null
    });
};

/**
 * Get Funds - Fetch account balance and margin details
 * @returns {Promise<Object|null>} { availablecash, collateral, m2mrealized, m2munrealized, utiliseddebits }
 */
export const getFunds = async () => {
    return makeApiRequest('/funds', {}, {
        context: 'Funds',
        defaultValue: null
    });
};

/**
 * Get Position Book - Fetch current open positions
 * @returns {Promise<Array>} Array of position objects
 */
export const getPositionBook = async () => {
    return makeApiRequest('/positionbook', {}, {
        context: 'PositionBook',
        defaultValue: []
    });
};

/**
 * Get Order Book - Fetch all orders with statistics
 * @returns {Promise<Object>} { orders: [], statistics: {} }
 */
export const getOrderBook = async () => {
    return makeApiRequest('/orderbook', {}, {
        context: 'OrderBook',
        defaultValue: { orders: [], statistics: {} }
    });
};

/**
 * Get Trade Book - Fetch executed trades
 * @returns {Promise<Array>} Array of trade objects
 */
export const getTradeBook = async () => {
    return makeApiRequest('/tradebook', {}, {
        context: 'TradeBook',
        defaultValue: []
    });
};

/**
 * Get Holdings - Fetch long-term stock holdings with P&L
 * @returns {Promise<Object>} { holdings: [], statistics: {} }
 */
export const getHoldings = async () => {
    return makeApiRequest('/holdings', {}, {
        context: 'Holdings',
        defaultValue: { holdings: [], statistics: {} }
    });
};
