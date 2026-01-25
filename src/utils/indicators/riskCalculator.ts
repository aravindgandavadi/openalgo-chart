/**
 * Risk Calculator - Calculate position size based on risk
 * Inspired by: https://www.tradingview.com/script/LJGj41W8-Risk-Calculator/
 *
 * @module riskCalculator
 */
import { formatCurrency } from '../shared/formatters';

/**
 * Trade side type
 */
export type TradeSide = 'BUY' | 'SELL';

/**
 * Risk calculation parameters
 */
export interface RiskCalculationParams {
    /** Total trading capital */
    capital: number;
    /** Risk percentage (0.5 to 5) */
    riskPercent: number;
    /** Entry price */
    entryPrice: number;
    /** Stop loss price */
    stopLossPrice: number;
    /** Optional manual target price (if provided, R:R is calculated) */
    targetPrice?: number | null;
    /** Risk:Reward ratio (used if targetPrice not provided) */
    riskRewardRatio?: number;
    /** Trade side: 'BUY' or 'SELL' */
    side: TradeSide;
}

/**
 * Formatted calculation result values
 */
export interface FormattedRiskResult {
    capital: string;
    riskPercent: string;
    riskAmount: string;
    entryPrice: string;
    stopLossPrice: string;
    slPoints: string;
    quantity: string;
    positionValue: string;
    targetPrice: string;
    rewardPoints: string;
    rewardAmount: string;
    rrRatio: string;
}

/**
 * Successful risk calculation result
 */
export interface RiskCalculationSuccess {
    success: true;
    riskAmount: number;
    slPoints: number;
    quantity: number;
    positionValue: number;
    targetPrice: number;
    rewardPoints: number;
    rewardAmount: number;
    riskRewardRatio: number;
    formatted: FormattedRiskResult;
    showTarget?: boolean;
}

/**
 * Error risk calculation result
 */
export interface RiskCalculationError {
    error: string;
    success?: false;
}

/**
 * Risk calculation result type
 */
export type RiskCalculationResult = RiskCalculationSuccess | RiskCalculationError;

/**
 * Calculate risk position and target based on capital, risk %, and risk-reward ratio
 *
 * @param params - Calculation parameters
 * @returns Calculation results or error
 */
export function calculateRiskPosition(params: RiskCalculationParams): RiskCalculationResult {
    const {
        capital,
        riskPercent,
        entryPrice,
        stopLossPrice,
        targetPrice = null,
        riskRewardRatio = 2,
        side
    } = params;

    // Validation: Check required fields
    if (!capital || capital <= 0) {
        return { error: 'Capital must be greater than 0' };
    }

    if (!riskPercent || riskPercent <= 0) {
        return { error: 'Risk % must be greater than 0' };
    }

    if (!entryPrice || entryPrice <= 0) {
        return { error: 'Entry price must be greater than 0' };
    }

    if (!stopLossPrice || stopLossPrice <= 0) {
        return { error: 'Stop loss price must be greater than 0' };
    }

    // Note: riskRewardRatio is optional if targetPrice is provided
    if (!targetPrice && (!riskRewardRatio || riskRewardRatio <= 0)) {
        return { error: 'Risk:Reward ratio must be greater than 0' };
    }

    // Step 1: Calculate risk amount
    const riskAmount = capital * (riskPercent / 100);

    // Step 2: Calculate SL points
    const slPoints = Math.abs(entryPrice - stopLossPrice);

    // Validation: SL must be different from entry
    if (slPoints <= 0) {
        return { error: 'Invalid stop loss: must be different from entry' };
    }

    // Validation: Check direction validity
    if (side === 'BUY' && entryPrice <= stopLossPrice) {
        return { error: 'For BUY: Entry must be above Stop Loss' };
    }

    if (side === 'SELL' && entryPrice >= stopLossPrice) {
        return { error: 'For SELL: Entry must be below Stop Loss' };
    }

    // Step 3: Calculate quantity
    const quantity = Math.floor(riskAmount / slPoints);

    // Check if quantity is valid
    if (quantity <= 0) {
        return { error: 'Calculated quantity is 0. Increase capital or risk %' };
    }

    // Step 4: Calculate position value
    const positionValue = quantity * entryPrice;

    // Step 5: Calculate target price OR R:R ratio
    let finalTargetPrice: number;
    let finalRiskRewardRatio: number;

    if (targetPrice && targetPrice > 0) {
        // Manual target provided - calculate R:R ratio from it
        finalTargetPrice = targetPrice;

        // Validate target is on correct side
        if (side === 'BUY' && targetPrice <= entryPrice) {
            return { error: 'For BUY: Target must be above Entry' };
        }
        if (side === 'SELL' && targetPrice >= entryPrice) {
            return { error: 'For SELL: Target must be below Entry' };
        }

        // Calculate R:R ratio from target
        const targetPoints = Math.abs(targetPrice - entryPrice);
        finalRiskRewardRatio = targetPoints / slPoints;

    } else {
        // No manual target - use R:R ratio to calculate target (current behavior)
        finalRiskRewardRatio = riskRewardRatio;

        if (side === 'BUY') {
            finalTargetPrice = entryPrice + (slPoints * finalRiskRewardRatio);
        } else {
            finalTargetPrice = entryPrice - (slPoints * finalRiskRewardRatio);
        }
    }

    // Step 6: Calculate reward
    const rewardPoints = Math.abs(finalTargetPrice - entryPrice);
    const rewardAmount = rewardPoints * quantity;

    // Return successful calculation
    return {
        success: true,
        riskAmount,
        slPoints,
        quantity,
        positionValue,
        targetPrice: finalTargetPrice,
        rewardPoints,
        rewardAmount,
        riskRewardRatio: finalRiskRewardRatio,

        // Formatted for display
        formatted: {
            capital: formatCurrency(capital, { showSymbol: true, decimals: 0 }),
            riskPercent: `${riskPercent}%`,
            riskAmount: formatCurrency(riskAmount, { showSymbol: true }),
            entryPrice: formatCurrency(entryPrice, { showSymbol: true }),
            stopLossPrice: formatCurrency(stopLossPrice, { showSymbol: true }),
            slPoints: slPoints.toFixed(2),
            quantity: quantity.toLocaleString('en-IN'),
            positionValue: formatCurrency(positionValue, { showSymbol: true }),
            targetPrice: formatCurrency(finalTargetPrice, { showSymbol: true }),
            rewardPoints: rewardPoints.toFixed(2),
            rewardAmount: formatCurrency(rewardAmount, { showSymbol: true }),
            rrRatio: `1 : ${Number.isInteger(finalRiskRewardRatio) ? finalRiskRewardRatio : finalRiskRewardRatio.toFixed(2)}`
        }
    };
}

/**
 * Auto-detect trade side based on entry and stop loss prices
 *
 * Logic:
 * - SELL when Stop Loss > Entry (stop loss above entry price)
 * - BUY when Stop Loss < Entry (stop loss below entry price)
 *
 * @param entryPrice - Entry price
 * @param stopLossPrice - Stop loss price
 * @returns 'BUY', 'SELL', or null if prices are equal/invalid
 */
export function autoDetectSide(entryPrice: number, stopLossPrice: number): TradeSide | null {
    if (!entryPrice || !stopLossPrice || entryPrice <= 0 || stopLossPrice <= 0) {
        return null;
    }

    if (entryPrice === stopLossPrice) {
        return null; // Invalid - entry and SL are same
    }

    // SELL when SL > Entry (stop loss above entry)
    // BUY when SL < Entry (stop loss below entry)
    return stopLossPrice > entryPrice ? 'SELL' : 'BUY';
}

/**
 * Validation parameters for risk calculator
 */
export interface RiskValidationParams {
    capital?: number;
    riskPercent?: number;
    entryPrice?: number;
    stopLossPrice?: number;
    targetPrice?: number;
    side?: TradeSide;
}

/**
 * Validation result
 */
export interface RiskValidationResult {
    isValid: boolean;
    errors: string[];
}

/**
 * Validate risk calculator parameters
 *
 * @param params - Parameters to validate
 * @returns Validation result with isValid flag and errors array
 */
export function validateRiskParams(params: RiskValidationParams): RiskValidationResult {
    const errors: string[] = [];

    if (!params.capital || params.capital <= 0) {
        errors.push('Capital must be greater than 0');
    }

    if (!params.riskPercent || params.riskPercent <= 0 || params.riskPercent > 100) {
        errors.push('Risk % must be between 0 and 100');
    }

    if (!params.entryPrice || params.entryPrice <= 0) {
        errors.push('Entry price must be greater than 0');
    }

    if (!params.stopLossPrice || params.stopLossPrice <= 0) {
        errors.push('Stop loss price must be greater than 0');
    }

    if (params.entryPrice && params.stopLossPrice && params.side) {
        if (params.side === 'BUY' && params.entryPrice <= params.stopLossPrice) {
            errors.push('For BUY: Entry must be above Stop Loss');
        }

        if (params.side === 'SELL' && params.entryPrice >= params.stopLossPrice) {
            errors.push('For SELL: Entry must be below Stop Loss');
        }
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Detailed validation errors
 */
export interface DetailedValidationErrors {
    capital?: string;
    capitalLevel?: 'warning';
    riskPercent?: string;
    riskPercentLevel?: 'warning';
    entryPrice?: string;
    stopLossPrice?: string;
    stopLossSuggestion?: string;
    targetPrice?: string;
    targetSuggestion?: string;
}

/**
 * Detailed validation result
 */
export interface DetailedValidationResult {
    isValid: boolean;
    errors: DetailedValidationErrors;
    warnings: string[];
}

/**
 * Enhanced validation with field-level errors and suggestions
 * Provides detailed error messages and suggestions for each field
 *
 * @param params - Parameters to validate
 * @returns Validation result with isValid, errors object, and warnings
 */
export function validateRiskParamsDetailed(params: RiskValidationParams): DetailedValidationResult {
    const errors: DetailedValidationErrors = {};

    // Capital validation
    if (!params.capital || params.capital <= 0) {
        errors.capital = 'Capital must be greater than 0';
    } else if (params.capital < 1000) {
        errors.capital = 'Capital should be at least 1,000';
        errors.capitalLevel = 'warning';
    }

    // Risk percent validation
    if (!params.riskPercent || params.riskPercent <= 0) {
        errors.riskPercent = 'Risk % must be greater than 0';
    } else if (params.riskPercent > 5) {
        errors.riskPercent = 'Risk > 5% is very aggressive';
        errors.riskPercentLevel = 'warning';
    } else if (params.riskPercent > 100) {
        errors.riskPercent = 'Risk % cannot exceed 100%';
    }

    // Entry price validation
    if (!params.entryPrice || params.entryPrice <= 0) {
        errors.entryPrice = 'Entry must be greater than 0';
    }

    // Stop loss validation
    if (!params.stopLossPrice || params.stopLossPrice <= 0) {
        errors.stopLossPrice = 'Stop loss must be greater than 0';
    }

    // Cross-field validation (entry vs stop loss)
    if (params.entryPrice && params.stopLossPrice && params.entryPrice > 0 && params.stopLossPrice > 0) {
        if (params.entryPrice === params.stopLossPrice) {
            errors.stopLossPrice = 'Stop loss must differ from entry';
            errors.entryPrice = 'Entry must differ from stop loss';
        } else {
            const side = params.side || 'BUY';

            if (side === 'BUY' && params.stopLossPrice >= params.entryPrice) {
                errors.stopLossPrice = `For BUY, stop loss must be below entry (< ${params.entryPrice.toFixed(2)})`;
                errors.stopLossSuggestion = Math.max(0.01, params.entryPrice * 0.98).toFixed(2);
            }

            if (side === 'SELL' && params.stopLossPrice <= params.entryPrice) {
                errors.stopLossPrice = `For SELL, stop loss must be above entry (> ${params.entryPrice.toFixed(2)})`;
                errors.stopLossSuggestion = (params.entryPrice * 1.02).toFixed(2);
            }
        }
    }

    // Target validation (if provided)
    if (params.targetPrice && params.targetPrice > 0 && params.entryPrice && params.entryPrice > 0) {
        const side = params.side || 'BUY';

        if (side === 'BUY' && params.targetPrice <= params.entryPrice) {
            errors.targetPrice = `For BUY, target must be above entry (> ${params.entryPrice.toFixed(2)})`;
            errors.targetSuggestion = (params.entryPrice * 1.02).toFixed(2);
        }

        if (side === 'SELL' && params.targetPrice >= params.entryPrice) {
            errors.targetPrice = `For SELL, target must be below entry (< ${params.entryPrice.toFixed(2)})`;
            errors.targetSuggestion = Math.max(0.01, params.entryPrice * 0.98).toFixed(2);
        }
    }

    // Filter out suggestion and level keys for validity check
    const errorKeys = Object.keys(errors).filter(k => !k.endsWith('Suggestion') && !k.endsWith('Level')) as (keyof DetailedValidationErrors)[];
    const warningKeys = errorKeys.filter(k => {
        const levelKey = `${k}Level` as keyof DetailedValidationErrors;
        return errors[levelKey] === 'warning';
    });

    // Only blocking errors (not warnings) should invalidate the form
    const blockingErrors = errorKeys.filter(k => !warningKeys.includes(k));

    return {
        isValid: blockingErrors.length === 0,
        errors,
        warnings: warningKeys as string[]
    };
}
