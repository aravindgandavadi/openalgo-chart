/**
 * Bollinger Bands Indicator
 * Shows price volatility using a middle SMA and upper/lower bands at standard deviations
 */

import { OHLCData, BollingerBandsResult, TimeValuePoint } from './types';

/**
 * Calculate Bollinger Bands
 * @param data - Array of OHLC data points with {time, open, high, low, close}
 * @param period - SMA period (default: 20)
 * @param stdDev - Number of standard deviations (default: 2)
 * @returns Object containing upper, middle, and lower band arrays
 */
export const calculateBollingerBands = (
  data: OHLCData[],
  period: number = 20,
  stdDev: number = 2
): BollingerBandsResult => {
  if (!Array.isArray(data) || data.length < period || period <= 0) {
    return { upper: [], middle: [], lower: [] };
  }

  // HIGH FIX BUG-6: Extra defensive check to prevent division by zero
  const safePeriod = Math.max(1, period);

  const upper: TimeValuePoint[] = [];
  const middle: TimeValuePoint[] = [];
  const lower: TimeValuePoint[] = [];

  for (let i = safePeriod - 1; i < data.length; i++) {
    // Calculate SMA
    let sum = 0;
    for (let j = 0; j < safePeriod; j++) {
      sum += data[i - j].close;
    }
    const sma = sum / safePeriod;

    // Calculate standard deviation
    let squaredDiffSum = 0;
    for (let j = 0; j < safePeriod; j++) {
      const diff = data[i - j].close - sma;
      squaredDiffSum += diff * diff;
    }
    const sd = Math.sqrt(squaredDiffSum / safePeriod);

    const time = data[i].time;
    middle.push({ time, value: sma });
    upper.push({ time, value: sma + (stdDev * sd) });
    lower.push({ time, value: sma - (stdDev * sd) });
  }

  return { upper, middle, lower };
};
