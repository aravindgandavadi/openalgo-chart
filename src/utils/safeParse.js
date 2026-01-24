/**
 * Safe Parsing Utilities
 * 
 * Helper functions to safely parse numbers and other data types,
 * handling NaN, null, undefined, and errors gracefully.
 */

/**
 * Safely parses a float value.
 * @param {any} value - The value to parse
 * @param {number} fallback - The fallback value if parsing fails (default: 0)
 * @returns {number} - The parsed float or the fallback
 */
export const safeParseFloat = (value, fallback = 0) => {
    if (value === null || value === undefined) return fallback;
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Safely parses an integer value.
 * @param {any} value - The value to parse
 * @param {number} radix - A number (from 2 to 36) that represents the numeral system to be used (default: 10)
 * @param {number} fallback - The fallback value if parsing fails (default: 0)
 * @returns {number} - The parsed integer or the fallback
 */
export const safeParseInt = (value, fallback = 0, radix = 10) => {
    if (value === null || value === undefined) return fallback;
    const parsed = parseInt(value, radix);
    return Number.isFinite(parsed) ? parsed : fallback;
};

/**
 * Safely parse a JSON string with a fallback value.
 * @param {string|null} value - The JSON string to parse
 * @param {any} fallback - The fallback value if parsing fails
 * @returns {any} - The parsed object/array or the fallback
 */
export const safeParseJSON = (value, fallback = null) => {
    if (!value || typeof value !== 'string') return fallback;
    try {
        return JSON.parse(value);
    } catch (e) {
        console.warn('safeParseJSON failed:', e);
        return fallback;
    }
};

export default {
    safeParseFloat,
    safeParseInt,
    safeParseJSON
};
