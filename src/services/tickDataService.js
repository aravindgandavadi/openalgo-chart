/**
 * Tick Data Service for Order Flow Analysis
 * Handles tick-level data subscription, aggregation, and footprint calculation
 */

import logger from '../utils/logger.js';

// Import constants from dedicated module
import {
    WS_MODES,
    DEFAULT_WS_HOST,
    MAX_RECONNECT_ATTEMPTS,
    BASE_RECONNECT_DELAY_MS,
    MAX_RECONNECT_DELAY_MS,
} from './tickConstants.js';

// Re-export WS_MODES for backward compatibility
export { WS_MODES };

// Maximum ticks to keep in memory per symbol (circular buffer)
const MAX_TICKS_IN_MEMORY = 10000;

// Active tick subscriptions
const tickSubscriptions = new Map();

// Tick data storage per symbol
const tickStore = new Map();

/**
 * Tick data structure
 * @typedef {Object} Tick
 * @property {number} time - Milliseconds timestamp
 * @property {number} price - Trade price
 * @property {number} volume - Trade volume
 * @property {'buy'|'sell'} side - Aggressor side (who lifted offer/hit bid)
 * @property {number} [bid] - Best bid at time of trade
 * @property {number} [ask] - Best ask at time of trade
 */

/**
 * Footprint level data structure
 * @typedef {Object} FootprintLevel
 * @property {number} price - Price level
 * @property {number} buyVolume - Volume from buy aggressors
 * @property {number} sellVolume - Volume from sell aggressors
 * @property {number} delta - buyVolume - sellVolume
 * @property {number} trades - Number of trades at this level
 * @property {number} buyTrades - Number of buy trades
 * @property {number} sellTrades - Number of sell trades
 * @property {'buy'|'sell'|null} imbalance - Imbalance direction if detected
 */

/**
 * Initialize tick store for a symbol
 * @param {string} symbol
 * @param {string} exchange
 */
const initTickStore = (symbol, exchange) => {
    const key = `${symbol}:${exchange}`;
    if (!tickStore.has(key)) {
        tickStore.set(key, {
            ticks: [],
            footprints: new Map(), // Keyed by candle start time
            listeners: new Set(),
        });
    }
    return tickStore.get(key);
};

/**
 * Add a tick to the store (circular buffer)
 * @param {string} symbol
 * @param {string} exchange
 * @param {Tick} tick
 */
const addTick = (symbol, exchange, tick) => {
    const store = initTickStore(symbol, exchange);

    // Add to circular buffer
    store.ticks.push(tick);
    if (store.ticks.length > MAX_TICKS_IN_MEMORY) {
        store.ticks.shift();
    }

    // Notify listeners
    store.listeners.forEach(listener => {
        try {
            listener(tick);
        } catch (error) {
            logger.debug('[TickService] Error in tick listener:', error);
        }
    });
};

/**
 * Get ticks for a symbol within a time range
 * @param {string} symbol
 * @param {string} exchange
 * @param {number} fromTime - Start time in milliseconds
 * @param {number} toTime - End time in milliseconds
 * @returns {Tick[]}
 */
export const getTicksInRange = (symbol, exchange, fromTime, toTime) => {
    const key = `${symbol}:${exchange}`;
    const store = tickStore.get(key);
    if (!store) return [];

    return store.ticks.filter(tick => tick.time >= fromTime && tick.time <= toTime);
};

/**
 * Get all stored ticks for a symbol
 * @param {string} symbol
 * @param {string} exchange
 * @returns {Tick[]}
 */
export const getAllTicks = (symbol, exchange) => {
    const key = `${symbol}:${exchange}`;
    const store = tickStore.get(key);
    return store ? [...store.ticks] : [];
};

/**
 * Add a tick listener for real-time updates
 * @param {string} symbol
 * @param {string} exchange
 * @param {function} listener
 */
export const addTickListener = (symbol, exchange, listener) => {
    const store = initTickStore(symbol, exchange);
    store.listeners.add(listener);

    return () => {
        store.listeners.delete(listener);
    };
};

/**
 * Clear tick data for a symbol
 * @param {string} symbol
 * @param {string} exchange
 */
export const clearTickData = (symbol, exchange) => {
    const key = `${symbol}:${exchange}`;
    tickStore.delete(key);
};

/**
 * Calculate price step (tick size) based on price
 * @param {number} price
 * @returns {number}
 */
export const calculatePriceStep = (price) => {
    if (price < 50) return 0.05;
    if (price < 250) return 0.05;
    if (price < 500) return 0.10;
    if (price < 1000) return 0.25;
    if (price < 5000) return 0.50;
    if (price < 10000) return 1.00;
    return 5.00;
};

/**
 * Round price to nearest price step
 * @param {number} price
 * @param {number} step
 * @returns {number}
 */
export const roundToStep = (price, step) => {
    return Math.round(price / step) * step;
};

/**
 * Aggregate ticks into footprint data for a candle
 * @param {Tick[]} ticks - Array of ticks within the candle period
 * @param {number} priceStep - Price level step size
 * @returns {Map<number, FootprintLevel>} - Map of price level to footprint data
 */
export const aggregateTicksToFootprint = (ticks, priceStep) => {
    const footprint = new Map();

    ticks.forEach(tick => {
        const level = roundToStep(tick.price, priceStep);

        if (!footprint.has(level)) {
            footprint.set(level, {
                price: level,
                buyVolume: 0,
                sellVolume: 0,
                delta: 0,
                trades: 0,
                buyTrades: 0,
                sellTrades: 0,
                imbalance: null,
            });
        }

        const fp = footprint.get(level);
        fp.trades += 1;

        if (tick.side === 'buy') {
            fp.buyVolume += tick.volume;
            fp.buyTrades += 1;
        } else {
            fp.sellVolume += tick.volume;
            fp.sellTrades += 1;
        }

        fp.delta = fp.buyVolume - fp.sellVolume;
    });

    return footprint;
};

/**
 * Calculate footprint for a specific candle time range
 * @param {string} symbol
 * @param {string} exchange
 * @param {number} candleStartTime - Candle start time in seconds (UTC)
 * @param {number} candleEndTime - Candle end time in seconds (UTC)
 * @param {number} priceStep - Price level step size
 * @returns {Map<number, FootprintLevel>}
 */
export const calculateFootprintForCandle = (symbol, exchange, candleStartTime, candleEndTime, priceStep) => {
    // Convert to milliseconds for tick comparison
    const fromTime = candleStartTime * 1000;
    const toTime = candleEndTime * 1000;

    const ticks = getTicksInRange(symbol, exchange, fromTime, toTime);
    return aggregateTicksToFootprint(ticks, priceStep);
};

/**
 * Subscribe to real-time tick data via SHARED WebSocket (Mode 3)
 * REFACTORED: Now uses sharedWebSocket from openalgo.js instead of creating a separate connection.
 * This consolidates WebSocket usage and prevents connection limit issues.
 * 
 * @param {string} symbol - Trading symbol
 * @param {string} exchange - Exchange code
 * @param {function} callback - Callback for each tick
 * @returns {Object} - Subscription handle with close() method
 */
export const subscribeToTicks = (symbol, exchange = 'NSE', callback) => {
    const key = `${symbol}:${exchange}`;

    // Initialize store
    const store = initTickStore(symbol, exchange);

    // Import sharedWebSocket dynamically to avoid circular dependency
    // The sharedWebSocket is a singleton managing a single connection
    const { sharedWebSocket } = require('./openalgo.js');

    // Subscribe using the shared WebSocket manager
    const subscription = sharedWebSocket.subscribe(
        [{ symbol, exchange }],
        (message) => {
            // Only process messages for our symbol
            if (message.type !== 'market_data' && message.type !== 'tick_data') return;
            if (message.symbol !== symbol) return;

            const data = message.data || message.tick || {};
            const ltp = parseFloat(data.ltp || data.last_price || data.price || 0);
            const volume = parseFloat(data.volume || data.last_traded_qty || data.qty || 1);

            // Infer trade direction from LTP vs bid/ask if available
            let side = 'buy';
            if (data.bid && data.ask) {
                const mid = (parseFloat(data.bid) + parseFloat(data.ask)) / 2;
                side = ltp >= mid ? 'buy' : 'sell';
            } else if (data.side) {
                side = data.side;
            } else if (data.buyer_initiated !== undefined) {
                side = data.buyer_initiated ? 'buy' : 'sell';
            }

            if (ltp > 0) {
                const tick = {
                    time: data.timestamp || Date.now(),
                    price: ltp,
                    volume: volume,
                    side: side,
                    bid: parseFloat(data.bid || 0),
                    ask: parseFloat(data.ask || 0),
                };

                // Store the tick
                addTick(symbol, exchange, tick);

                // Call the callback
                if (callback) {
                    callback(tick);
                }
            }
        },
        WS_MODES.TICK // Mode 3 for tick data
    );

    // Store subscription reference
    tickSubscriptions.set(key, {
        subscription,
        close: () => subscription.close()
    });

    // Return managed interface compatible with existing code
    return {
        close: () => {
            tickSubscriptions.delete(key);
            subscription.close();
        },
        forceClose: () => {
            tickSubscriptions.delete(key);
            subscription.close();
        },
        get readyState() {
            return subscription.readyState;
        }
    };
};

/**
 * Close all tick subscriptions
 */
export const closeAllTickSubscriptions = () => {
    tickSubscriptions.forEach((sub, key) => {
        try {
            if (sub.close) sub.close();
        } catch (error) {
            logger.debug('[TickService] Error closing subscription:', key, error);
        }
    });
    tickSubscriptions.clear();
};

/**
 * Get tick statistics for a symbol
 * @param {string} symbol
 * @param {string} exchange
 * @returns {Object}
 */
export const getTickStats = (symbol, exchange) => {
    const key = `${symbol}:${exchange}`;
    const store = tickStore.get(key);

    if (!store || store.ticks.length === 0) {
        return {
            tickCount: 0,
            buyVolume: 0,
            sellVolume: 0,
            delta: 0,
            avgPrice: 0,
            minPrice: 0,
            maxPrice: 0,
        };
    }

    let buyVolume = 0;
    let sellVolume = 0;
    let totalPrice = 0;
    let minPrice = Infinity;
    let maxPrice = -Infinity;

    store.ticks.forEach(tick => {
        if (tick.side === 'buy') {
            buyVolume += tick.volume;
        } else {
            sellVolume += tick.volume;
        }
        totalPrice += tick.price * tick.volume;
        minPrice = Math.min(minPrice, tick.price);
        maxPrice = Math.max(maxPrice, tick.price);
    });

    const totalVolume = buyVolume + sellVolume;

    return {
        tickCount: store.ticks.length,
        buyVolume,
        sellVolume,
        delta: buyVolume - sellVolume,
        avgPrice: totalVolume > 0 ? totalPrice / totalVolume : 0,
        minPrice: minPrice === Infinity ? 0 : minPrice,
        maxPrice: maxPrice === -Infinity ? 0 : maxPrice,
    };
};

export default {
    subscribeToTicks,
    getTicksInRange,
    getAllTicks,
    addTickListener,
    clearTickData,
    aggregateTicksToFootprint,
    calculateFootprintForCandle,
    calculatePriceStep,
    roundToStep,
    getTickStats,
    closeAllTickSubscriptions,
    WS_MODES,
};
