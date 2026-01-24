/**
 * API Helper
 * Centralized API request utility to eliminate duplicate boilerplate across service files
 * Used by: accountService, orderService, marketService, instrumentService, etc.
 */

import logger from '../utils/logger.js';
import { getApiKey, getApiBase } from './apiConfig';

/**
 * @typedef {Object} ApiRequestOptions
 * @property {'GET'|'POST'|'PUT'|'DELETE'} [method='POST'] - HTTP method
 * @property {string} [context='API'] - Context for logging (e.g., 'OrderService', 'AccountService')
 * @property {any} [defaultValue=null] - Default value to return on error
 * @property {boolean} [requiresAuth=true] - Whether the request requires API key
 * @property {Object} [extraHeaders={}] - Additional headers to include
 * @property {boolean} [rawResponse=false] - Return raw response instead of data.data
 */

/**
 * Make an authenticated API request with standardized error handling
 *
 * @param {string} endpoint - API endpoint (e.g., '/funds', '/positionbook')
 * @param {Object} [body={}] - Request body (apikey will be added automatically)
 * @param {ApiRequestOptions} [options={}] - Request options
 * @returns {Promise<any>} Response data or default value on error
 *
 * @example
 * // Simple POST request
 * const funds = await makeApiRequest('/funds', {}, { context: 'Funds', defaultValue: null });
 *
 * @example
 * // POST with body
 * const result = await makeApiRequest('/placeorder', { symbol: 'RELIANCE', action: 'BUY' }, { context: 'Order' });
 *
 * @example
 * // Return array on error
 * const positions = await makeApiRequest('/positionbook', {}, { context: 'Positions', defaultValue: [] });
 */
export const makeApiRequest = async (endpoint, body = {}, options = {}) => {
    const {
        method = 'POST',
        context = 'API',
        defaultValue = null,
        requiresAuth = true,
        extraHeaders = {},
        rawResponse = false,
    } = options;

    try {
        // Check for API key if required
        if (requiresAuth) {
            const apiKey = getApiKey();
            if (!apiKey) {
                logger.warn(`[${context}] No API key available`);
                return defaultValue;
            }
            // Add apikey to body for POST requests
            if (method === 'POST' || method === 'PUT') {
                body.apikey = apiKey;
            }
        }

        const url = `${getApiBase()}${endpoint}`;
        const fetchOptions = {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...extraHeaders,
            },
            credentials: 'include',
        };

        // Add body for POST/PUT requests
        if (method === 'POST' || method === 'PUT') {
            fetchOptions.body = JSON.stringify(body);
        }

        const response = await fetch(url, fetchOptions);

        if (!response.ok) {
            logger.warn(`[${context}] API failed:`, response.status);
            return defaultValue;
        }

        const data = await response.json();

        // Return raw response if requested
        if (rawResponse) {
            return data;
        }

        // Standard OpenAlgo response format: { status: 'success', data: {...} }
        if (data.status === 'success') {
            return data.data ?? defaultValue;
        }

        // Handle error response
        if (data.status === 'error') {
            logger.warn(`[${context}] API error:`, data.message || 'Unknown error');
        }

        return defaultValue;
    } catch (error) {
        logger.error(`[${context}] Request error:`, error);
        return defaultValue;
    }
};

/**
 * Make a GET request (convenience wrapper)
 * @param {string} endpoint - API endpoint
 * @param {ApiRequestOptions} [options={}] - Request options
 * @returns {Promise<any>} Response data or default value
 */
export const makeGetRequest = async (endpoint, options = {}) => {
    return makeApiRequest(endpoint, {}, { ...options, method: 'GET' });
};

/**
 * Make a POST request (convenience wrapper)
 * @param {string} endpoint - API endpoint
 * @param {Object} [body={}] - Request body
 * @param {ApiRequestOptions} [options={}] - Request options
 * @returns {Promise<any>} Response data or default value
 */
export const makePostRequest = async (endpoint, body = {}, options = {}) => {
    return makeApiRequest(endpoint, body, { ...options, method: 'POST' });
};

/**
 * Batch multiple API requests with Promise.allSettled for resilience
 * One failing request won't affect others
 *
 * @param {Array<{endpoint: string, body?: Object, options?: ApiRequestOptions}>} requests - Array of request configs
 * @returns {Promise<Array<{status: 'fulfilled'|'rejected', value?: any, reason?: Error}>>}
 *
 * @example
 * const [positions, orders, funds] = await batchApiRequests([
 *   { endpoint: '/positionbook', options: { context: 'Positions', defaultValue: [] } },
 *   { endpoint: '/orderbook', options: { context: 'Orders', defaultValue: { orders: [] } } },
 *   { endpoint: '/funds', options: { context: 'Funds' } }
 * ]);
 */
export const batchApiRequests = async (requests) => {
    const promises = requests.map(({ endpoint, body = {}, options = {} }) =>
        makeApiRequest(endpoint, body, options)
    );

    const results = await Promise.allSettled(promises);

    return results.map((result, index) => {
        if (result.status === 'rejected') {
            logger.warn(`[BatchAPI] Request ${index} failed:`, result.reason);
            return requests[index].options?.defaultValue ?? null;
        }
        return result.value;
    });
};

export default {
    makeApiRequest,
    makeGetRequest,
    makePostRequest,
    batchApiRequests,
};
