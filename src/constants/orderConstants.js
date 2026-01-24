/**
 * Order Constants
 * Centralized trading order constants to ensure consistency across all order-related components
 */

// Order types supported by the trading API
export const ORDER_TYPES = {
    MARKET: 'MARKET',
    LIMIT: 'LIMIT',
    SL: 'SL',       // Stop Loss with limit price
    SL_M: 'SL-M',   // Stop Loss Market
};

// Product types (position types)
export const PRODUCTS = {
    MIS: 'MIS',     // Intraday (Margin Intraday Square-off)
    CNC: 'CNC',     // Delivery (Cash and Carry)
    NRML: 'NRML',   // Carry forward (Normal / Overnight)
};

// Order actions
export const ORDER_ACTIONS = {
    BUY: 'BUY',
    SELL: 'SELL',
};

// Exchanges that require lot size multiples (F&O exchanges)
export const FNO_EXCHANGES = ['NFO', 'MCX', 'BFO', 'CDS', 'BCD'];

// Order type descriptive labels (for UI)
export const ORDER_TYPE_LABELS = {
    [ORDER_TYPES.MARKET]: 'Market',
    [ORDER_TYPES.LIMIT]: 'Limit',
    [ORDER_TYPES.SL]: 'Stop Loss',
    [ORDER_TYPES.SL_M]: 'SL-Market',
};

// Product type descriptive labels (for UI)
export const PRODUCT_LABELS = {
    [PRODUCTS.MIS]: 'Intraday (MIS)',
    [PRODUCTS.CNC]: 'Longterm (CNC)',
    [PRODUCTS.NRML]: 'Overnight (NRML)',
};

// Order types that require a limit price
export const PRICE_REQUIRED_ORDER_TYPES = [ORDER_TYPES.LIMIT, ORDER_TYPES.SL];

// Order types that require a trigger price
export const TRIGGER_REQUIRED_ORDER_TYPES = [ORDER_TYPES.SL, ORDER_TYPES.SL_M];

export default {
    ORDER_TYPES,
    PRODUCTS,
    ORDER_ACTIONS,
    FNO_EXCHANGES,
    ORDER_TYPE_LABELS,
    PRODUCT_LABELS,
    PRICE_REQUIRED_ORDER_TYPES,
    TRIGGER_REQUIRED_ORDER_TYPES,
};
