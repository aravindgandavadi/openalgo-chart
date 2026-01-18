/**
 * Indicator Data Manager
 * Manages indicator calculations and data caching for alert evaluation
 */

import { calculateRSI } from '../utils/indicators';
import { calculateMACD } from '../utils/indicators';
import { calculateBollingerBands } from '../utils/indicators';
import { calculateStochastic } from '../utils/indicators';
import { calculateSupertrend } from '../utils/indicators';
import { calculateVWAP } from '../utils/indicators';
import { calculateSMA } from '../utils/indicators';
import { calculateEMA } from '../utils/indicators';
import { calculateATR } from '../utils/indicators';
import logger from '../utils/logger';

export class IndicatorDataManager {
    constructor() {
        /**
         * Cache for indicator values per symbol-interval
         * Map<string, { timestamp, indicators, ohlcData }>
         */
        this.cache = new Map();

        /**
         * Cache duration in milliseconds (30 seconds)
         */
        this.cacheDuration = 30000;
    }

    /**
     * Get cache key for a symbol-interval combination
     * @param {string} symbol - Trading symbol
     * @param {string} exchange - Exchange
     * @param {string} interval - Timeframe
     * @returns {string} - Cache key
     */
    getCacheKey(symbol, exchange, interval) {
        return `${symbol}:${exchange}:${interval}`;
    }

    /**
     * Get current indicator values for a symbol
     * @param {string} symbol - Trading symbol
     * @param {string} exchange - Exchange
     * @param {string} interval - Timeframe
     * @param {Object} indicators - Active indicators configuration
     * @param {Array} ohlcData - Price data array
     * @returns {Object} - Indicator values with current and previous data
     */
    getIndicatorValues(symbol, exchange, interval, indicators, ohlcData) {
        const cacheKey = this.getCacheKey(symbol, exchange, interval);

        // Check cache
        const cached = this.cache.get(cacheKey);
        if (cached && (Date.now() - cached.timestamp) < this.cacheDuration) {
            logger.debug(`[IndicatorDataManager] Using cached data for ${cacheKey}`);
            return cached.indicators;
        }

        // Calculate fresh indicator values
        logger.debug(`[IndicatorDataManager] Calculating fresh indicators for ${cacheKey}`);
        const indicatorData = this.calculateAllIndicators(indicators, ohlcData);

        // Cache the results
        this.cache.set(cacheKey, {
            timestamp: Date.now(),
            indicators: indicatorData,
            ohlcData: ohlcData.slice(-2), // Keep last 2 bars for comparison
        });

        return indicatorData;
    }

    /**
     * Calculate all active indicators
     * @param {Object} indicators - Indicators configuration
     * @param {Array} ohlcData - Price data
     * @returns {Object} - Calculated indicator values
     */
    calculateAllIndicators(indicators, ohlcData) {
        if (!ohlcData || ohlcData.length < 2) {
            return {};
        }

        const results = {};

        // RSI
        if (indicators.rsi?.enabled) {
            const rsiData = calculateRSI(ohlcData, indicators.rsi.period || 14);
            if (rsiData && rsiData.length >= 2) {
                const latest = rsiData[rsiData.length - 1];
                const previous = rsiData[rsiData.length - 2];
                results.rsi = {
                    value: latest?.value,
                    previous: previous?.value,
                    time: latest?.time,
                };
            }
        }

        // MACD
        if (indicators.macd?.enabled) {
            const macdData = calculateMACD(
                ohlcData,
                indicators.macd.fast || 12,
                indicators.macd.slow || 26,
                indicators.macd.signal || 9
            );
            if (macdData && macdData.length >= 2) {
                const latest = macdData[macdData.length - 1];
                const previous = macdData[macdData.length - 2];
                results.macd = {
                    macd: latest?.MACD,
                    signal: latest?.signal,
                    histogram: latest?.histogram,
                    previous: {
                        macd: previous?.MACD,
                        signal: previous?.signal,
                        histogram: previous?.histogram,
                    },
                    time: latest?.time,
                };
            }
        }

        // Bollinger Bands
        if (indicators.bollingerBands?.enabled) {
            const bbData = calculateBollingerBands(
                ohlcData,
                indicators.bollingerBands.period || 20,
                indicators.bollingerBands.stdDev || 2
            );
            if (bbData && bbData.length >= 2) {
                const latest = bbData[bbData.length - 1];
                const previous = bbData[bbData.length - 2];
                results.bollingerBands = {
                    upper: latest?.upper,
                    middle: latest?.middle,
                    lower: latest?.lower,
                    previous: {
                        upper: previous?.upper,
                        middle: previous?.middle,
                        lower: previous?.lower,
                    },
                    time: latest?.time,
                };
            }
        }

        // Stochastic
        if (indicators.stochastic?.enabled) {
            const stochData = calculateStochastic(
                ohlcData,
                indicators.stochastic.kPeriod || 14,
                indicators.stochastic.dPeriod || 3,
                indicators.stochastic.smooth || 3
            );
            if (stochData && stochData.length >= 2) {
                const latest = stochData[stochData.length - 1];
                const previous = stochData[stochData.length - 2];
                results.stochastic = {
                    k: latest?.k,
                    d: latest?.d,
                    previous: {
                        k: previous?.k,
                        d: previous?.d,
                    },
                    time: latest?.time,
                };
            }
        }

        // Supertrend
        if (indicators.supertrend?.enabled) {
            const supertrendData = calculateSupertrend(
                ohlcData,
                indicators.supertrend.period || 10,
                indicators.supertrend.multiplier || 3
            );
            if (supertrendData && supertrendData.length >= 2) {
                const latest = supertrendData[supertrendData.length - 1];
                const previous = supertrendData[supertrendData.length - 2];
                results.supertrend = {
                    supertrend: latest?.supertrend,
                    direction: latest?.direction,
                    previous: {
                        supertrend: previous?.supertrend,
                        direction: previous?.direction,
                    },
                    time: latest?.time,
                };
            }
        }

        // VWAP
        if (indicators.vwap?.enabled) {
            const vwapData = calculateVWAP(ohlcData);
            if (vwapData && vwapData.length >= 2) {
                const latest = vwapData[vwapData.length - 1];
                const previous = vwapData[vwapData.length - 2];
                results.vwap = {
                    value: latest?.value,
                    previous: previous?.value,
                    time: latest?.time,
                };
            }
        }

        // SMA
        if (indicators.sma) {
            const smaData = calculateSMA(ohlcData, indicators.sma.period || 20);
            if (smaData && smaData.length >= 2) {
                const latest = smaData[smaData.length - 1];
                const previous = smaData[smaData.length - 2];
                results.sma = {
                    value: latest?.value,
                    previous: previous?.value,
                    time: latest?.time,
                };
            }
        }

        // EMA
        if (indicators.ema) {
            const emaData = calculateEMA(ohlcData, indicators.ema.period || 20);
            if (emaData && emaData.length >= 2) {
                const latest = emaData[emaData.length - 1];
                const previous = emaData[emaData.length - 2];
                results.ema = {
                    value: latest?.value,
                    previous: previous?.value,
                    time: latest?.time,
                };
            }
        }

        // ATR
        if (indicators.atr?.enabled) {
            const atrData = calculateATR(ohlcData, indicators.atr.period || 14);
            if (atrData && atrData.length >= 2) {
                const latest = atrData[atrData.length - 1];
                const previous = atrData[atrData.length - 2];
                results.atr = {
                    value: latest?.value,
                    previous: previous?.value,
                    time: latest?.time,
                };
            }
        }

        return results;
    }

    /**
     * Get specific indicator value
     * @param {string} symbol - Trading symbol
     * @param {string} exchange - Exchange
     * @param {string} interval - Timeframe
     * @param {string} indicatorId - Indicator identifier
     * @returns {Object|null} - Indicator value or null
     */
    getIndicatorValue(symbol, exchange, interval, indicatorId) {
        const cacheKey = this.getCacheKey(symbol, exchange, interval);
        const cached = this.cache.get(cacheKey);

        if (!cached) {
            return null;
        }

        return cached.indicators[indicatorId] || null;
    }

    /**
     * Clear cache for a specific symbol-interval
     * @param {string} symbol - Trading symbol
     * @param {string} exchange - Exchange
     * @param {string} interval - Timeframe
     */
    clearCache(symbol, exchange, interval) {
        const cacheKey = this.getCacheKey(symbol, exchange, interval);
        this.cache.delete(cacheKey);
        logger.debug(`[IndicatorDataManager] Cleared cache for ${cacheKey}`);
    }

    /**
     * Clear all cached data
     */
    clearAllCache() {
        this.cache.clear();
        logger.debug('[IndicatorDataManager] Cleared all cache');
    }

    /**
     * Get cache stats
     * @returns {Object} - Cache statistics
     */
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            oldestEntry: this.getOldestEntry(),
        };
    }

    /**
     * Get oldest cache entry
     * @returns {Object|null} - Oldest entry info or null
     */
    getOldestEntry() {
        let oldest = null;
        let oldestTime = Infinity;

        for (const [key, value] of this.cache.entries()) {
            if (value.timestamp < oldestTime) {
                oldestTime = value.timestamp;
                oldest = { key, timestamp: value.timestamp };
            }
        }

        return oldest;
    }

    /**
     * Clean expired cache entries
     */
    cleanExpiredCache() {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.cacheDuration) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug(`[IndicatorDataManager] Cleaned ${cleaned} expired cache entries`);
        }
    }
}

/**
 * Singleton instance for global use
 */
export const indicatorDataManager = new IndicatorDataManager();

export default IndicatorDataManager;
