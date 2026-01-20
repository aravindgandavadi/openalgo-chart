/**
 * Unified Indicator Cleanup Engine
 *
 * Centralized cleanup system for all indicator types.
 * Handles series removal, pane cleanup, price lines, primitives, and array-based indicators.
 *
 * This replaces the fragile, scattered cleanup logic with a robust,
 * metadata-driven approach that ensures complete resource cleanup.
 */

import { getIndicatorMetadata, INDICATOR_CLEANUP_TYPES } from './indicatorMetadata';

/**
 * Validate if an object is a valid LightweightCharts series
 * @param {*} obj - Object to validate
 * @returns {boolean} True if valid series
 */
export function isValidSeries(obj) {
  if (!obj || typeof obj !== 'object') {
    return false;
  }

  // Check for series-specific methods
  const hasSeriesMethods =
    typeof obj.setData === 'function' ||
    typeof obj.update === 'function' ||
    typeof obj.applyOptions === 'function';

  return hasSeriesMethods;
}

/**
 * Validate if an object is a valid chart pane
 * @param {*} pane - Pane object to validate
 * @returns {boolean} True if valid pane
 */
export function isValidPane(pane) {
  if (!pane || typeof pane !== 'object') {
    return false;
  }

  // Check for pane-specific methods
  return typeof pane.series === 'function' || Array.isArray(pane._series);
}

/**
 * Safely remove price lines from a series
 * @param {Object} series - The series object
 * @param {Array<string>} priceLineKeys - Array of property keys containing price lines
 */
export function cleanupPriceLines(series, priceLineKeys) {
  if (!series || !Array.isArray(priceLineKeys)) {
    return;
  }

  priceLineKeys.forEach(key => {
    const priceLine = series[key];
    if (priceLine) {
      try {
        // Price lines are removed via the series
        if (typeof series.removePriceLine === 'function') {
          series.removePriceLine(priceLine);
        }
        // Clean up the reference
        delete series[key];
      } catch (error) {
        console.warn(`Failed to remove price line ${key}:`, error);
      }
    }
  });
}

/**
 * Safely remove a single series from the chart
 * @param {Object} series - The series to remove
 * @param {Object} chart - The chart instance
 * @param {Object} pane - The pane containing the series (optional)
 */
export function removeSingleSeries(series, chart, pane) {
  if (!isValidSeries(series)) {
    console.warn('Attempted to remove invalid series:', series);
    return;
  }

  try {
    if (chart && typeof chart.removeSeries === 'function') {
      chart.removeSeries(series);
    } else if (pane && typeof pane.removeSeries === 'function') {
      pane.removeSeries(series);
    }
  } catch (error) {
    console.warn('Error removing series:', error);
  }
}

/**
 * Remove multiple series from a multi-series object
 * @param {Object} seriesObj - Object containing multiple series (e.g., { macdLine, signalLine, histogram })
 * @param {Object} chart - The chart instance
 * @param {Object} pane - The pane containing the series
 * @param {Object} metadata - Indicator metadata with seriesKeys
 */
export function removeMultiSeries(seriesObj, chart, pane, metadata) {
  if (!seriesObj || typeof seriesObj !== 'object') {
    return;
  }

  const seriesKeys = metadata.seriesKeys || [];

  seriesKeys.forEach(key => {
    const series = seriesObj[key];
    if (series && isValidSeries(series)) {
      removeSingleSeries(series, chart, pane);
    }
  });

  // Also try to remove any series not in the keys (fallback)
  Object.values(seriesObj).forEach(series => {
    if (isValidSeries(series)) {
      try {
        removeSingleSeries(series, chart, pane);
      } catch (error) {
        // Ignore errors for already-removed series
      }
    }
  });
}

/**
 * Remove an array of series
 * @param {Array|Object} arrayOrRef - Array of series or ref object containing array
 * @param {Object} chart - The chart instance
 */
export function removeSeriesArray(arrayOrRef, chart) {
  // Handle ref object
  const array = arrayOrRef?.current || arrayOrRef;

  if (!Array.isArray(array)) {
    return;
  }

  array.forEach(series => {
    if (isValidSeries(series)) {
      removeSingleSeries(series, chart, null);
    }
  });

  // Clear the array
  if (arrayOrRef?.current) {
    arrayOrRef.current = [];
  } else if (Array.isArray(arrayOrRef)) {
    arrayOrRef.length = 0;
  }
}

/**
 * Detach and remove a primitive from the main series
 * @param {Object} primitiveRef - Ref containing the primitive
 * @param {Object} mainSeries - The main series to detach from
 */
export function removePrimitive(primitiveRef, mainSeries) {
  const primitive = primitiveRef?.current || primitiveRef;

  if (!primitive) {
    return;
  }

  try {
    if (mainSeries && typeof mainSeries.detachPrimitive === 'function') {
      mainSeries.detachPrimitive(primitive);
    }
  } catch (error) {
    console.warn('Error detaching primitive:', error);
  } finally {
    // Clear the ref
    if (primitiveRef && 'current' in primitiveRef) {
      primitiveRef.current = null;
    }
  }
}

/**
 * Safely remove a pane from the chart
 * Uses pane object reference instead of fragile index-based removal
 * @param {Object} chart - The chart instance
 * @param {Object} pane - The pane object to remove
 */
export function removePane(chart, pane) {
  if (!chart || !pane) {
    return;
  }

  if (!isValidPane(pane)) {
    console.warn('Attempted to remove invalid pane:', pane);
    return;
  }

  try {
    // Modern API: remove pane by reference
    if (typeof chart.removePane === 'function') {
      chart.removePane(pane);
    }
    // Fallback: remove pane by finding its index
    else if (typeof chart.panes === 'function') {
      const panes = chart.panes();
      const index = panes.indexOf(pane);
      if (index > 0) {
        // Never remove index 0 (main pane)
        chart.removePaneByIndex?.(index);
      }
    }
  } catch (error) {
    console.warn('Error removing pane:', error);
  }
}

/**
 * Main cleanup function for a single indicator
 * @param {string} indicatorId - Unique identifier of the indicator
 * @param {string} indicatorType - Type of indicator (e.g., 'sma', 'rsi')
 * @param {Object} context - Cleanup context containing chart, refs, and maps
 * @returns {boolean} True if cleanup was successful
 */
export function cleanupIndicator(indicatorId, indicatorType, context) {
  if (!indicatorType) {
    console.warn(`Cannot cleanup indicator ${indicatorId}: type is undefined`);
    return false;
  }

  const metadata = getIndicatorMetadata(indicatorType);

  if (!metadata) {
    console.warn(`No metadata found for indicator type: ${indicatorType}`);
    return false;
  }

  const {
    chart,
    mainSeries,
    indicatorSeriesMap,
    indicatorPanesMap,
    refs
  } = context;

  try {
    // STEP 1: Handle primitives first (TPO, Risk Calculator)
    if (metadata.hasPrimitive && metadata.primitiveRef) {
      const primitiveRef = refs[metadata.primitiveRef];
      if (primitiveRef) {
        removePrimitive(primitiveRef, mainSeries);
      }
    }

    // STEP 2: Handle array-based indicators (First Candle, Range Breakout, PAR)
    if (metadata.cleanupType === INDICATOR_CLEANUP_TYPES.SERIES_ARRAY) {
      if (metadata.arrayRef && refs[metadata.arrayRef]) {
        removeSeriesArray(refs[metadata.arrayRef], chart);
      }
      // Clean up maps
      indicatorSeriesMap.delete(indicatorId);
      indicatorPanesMap.delete(indicatorId);
      return true;
    }

    // STEP 3: Get series and pane from maps
    const series = indicatorSeriesMap.get(indicatorId);
    const pane = indicatorPanesMap.get(indicatorId);

    // STEP 4: Remove price lines if present
    if (metadata.hasPriceLines && series) {
      cleanupPriceLines(series, metadata.priceLineKeys || []);
    }

    // STEP 5: Remove series based on cleanup type
    switch (metadata.cleanupType) {
      case INDICATOR_CLEANUP_TYPES.SIMPLE_SERIES:
        removeSingleSeries(series, chart, pane);
        break;

      case INDICATOR_CLEANUP_TYPES.MULTI_SERIES:
        removeMultiSeries(series, chart, pane, metadata);
        break;

      case INDICATOR_CLEANUP_TYPES.PRIMITIVE:
        // Already handled in STEP 1
        break;

      case INDICATOR_CLEANUP_TYPES.COMPLEX:
        // Complex indicators may need custom cleanup
        // For now, treat as multi-series
        removeMultiSeries(series, chart, pane, metadata);
        break;

      default:
        console.warn(`Unknown cleanup type: ${metadata.cleanupType}`);
        // Fallback: try to remove as single series
        removeSingleSeries(series, chart, pane);
    }

    // STEP 6: Remove pane if it exists
    if (metadata.hasPane && pane) {
      removePane(chart, pane);
    }

    // STEP 7: Clean up maps
    indicatorSeriesMap.delete(indicatorId);
    indicatorPanesMap.delete(indicatorId);

    return true;
  } catch (error) {
    console.error(`Error cleaning up indicator ${indicatorId} (${indicatorType}):`, error);
    return false;
  }
}

/**
 * Cleanup multiple indicators
 * @param {Array<string>} indicatorIds - Array of indicator IDs to remove
 * @param {Map<string, string>} indicatorTypesMap - Map of indicator ID to type
 * @param {Object} context - Cleanup context
 * @returns {Object} Summary of cleanup results
 */
export function cleanupIndicators(indicatorIds, indicatorTypesMap, context) {
  const results = {
    total: indicatorIds.length,
    successful: 0,
    failed: 0,
    errors: []
  };

  indicatorIds.forEach(id => {
    const type = indicatorTypesMap.get(id);
    const success = cleanupIndicator(id, type, context);

    if (success) {
      results.successful++;
      // Also remove from types map
      indicatorTypesMap.delete(id);
    } else {
      results.failed++;
      results.errors.push({ id, type });
    }
  });

  if (results.failed > 0) {
    console.warn('Indicator cleanup summary:', results);
  }

  return results;
}

/**
 * Emergency cleanup - removes all indicators
 * Use with caution, primarily for testing or recovery scenarios
 * @param {Object} context - Cleanup context
 */
export function cleanupAllIndicators(context) {
  const { indicatorSeriesMap, indicatorTypesMap } = context;

  const allIds = Array.from(indicatorSeriesMap.keys());
  return cleanupIndicators(allIds, indicatorTypesMap, context);
}

/**
 * Verify cleanup completeness
 * Useful for testing and debugging
 * @param {Object} context - Cleanup context
 * @returns {Object} Verification results
 */
export function verifyCleanup(context) {
  const { chart, indicatorSeriesMap, indicatorPanesMap } = context;

  let chartSeries = [];
  let chartPanes = [];

  try {
    chartSeries = chart.series?.() || [];
    chartPanes = chart.panes?.() || [];
  } catch (error) {
    console.warn('Error getting chart info:', error);
  }

  return {
    remainingSeriesInMap: indicatorSeriesMap.size,
    remainingPanesInMap: indicatorPanesMap.size,
    chartSeriesCount: chartSeries.length,
    chartPaneCount: chartPanes.length,
    expectedSeriesCount: 1, // Should only have main series
    expectedPaneCount: 1,   // Should only have main pane
    isClean:
      indicatorSeriesMap.size === 0 &&
      indicatorPanesMap.size === 0 &&
      chartSeriesCount === 1 &&
      chartPaneCount === 1
  };
}
