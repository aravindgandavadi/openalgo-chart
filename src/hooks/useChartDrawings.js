import { useEffect, useRef } from 'react';
import { loadDrawings, saveDrawings } from '../services/openalgo';
import logger from '../utils/logger';

/**
 * Hook to handle loading and auto-saving of drawings.
 * @param {Object} manager - LineToolManager instance
 * @param {string} symbol - Current symbol
 * @param {string} exchange - Current exchange
 * @param {string} interval - Current interval
 */
export const useChartDrawings = (manager, symbol, exchange, interval, onDrawingsSync) => {
    // Keep track of the current manager to ensure we don't attach listeners multiple times if manager identity is stable but other deps change
    const managerRef = useRef(null);
    // LOW FIX ML-14: Use ref instead of local variable for timeout (best practice)
    const saveTimeoutRef = useRef(null);

    useEffect(() => {
        if (!manager || !symbol) return;

        managerRef.current = manager;

        // Track if effect is still active
        let isMounted = true;

        // Load saved drawings from backend
        const loadSavedDrawings = async () => {
            logger.debug('[ChartComponent] loadSavedDrawings called for:', symbol, exchange, interval);
            try {
                const drawings = await loadDrawings(symbol, exchange, interval);
                if (!isMounted) return; // Abort if unmounted

                logger.debug('[ChartComponent] loadDrawings result:', drawings);
                if (drawings && drawings.length > 0 && manager.importDrawings) {
                    logger.debug('[ChartComponent] Importing', drawings.length, 'drawings...');
                    try {
                        manager.importDrawings(drawings, true);
                        logger.debug('[ChartComponent] Import complete!');

                        // Initial sync after load
                        if (onDrawingsSync && manager.exportDrawings) {
                            onDrawingsSync(manager.exportDrawings());
                        }
                    } catch (importErr) {
                        logger.warn('[ChartComponent] Error importing drawings (chart likely disposed):', importErr);
                    }
                } else {
                    logger.debug('[ChartComponent] No drawings to import or importDrawings not available');
                }
            } catch (error) {
                if (isMounted) {
                    logger.warn('[ChartComponent] Failed to load saved drawings:', error);
                }
            }
        };
        loadSavedDrawings();

        // Set up debounced auto-save for drawings
        const autoSaveDrawings = () => {
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            saveTimeoutRef.current = setTimeout(async () => {
                try {
                    if (manager.exportDrawings) {
                        const drawings = manager.exportDrawings();
                        await saveDrawings(symbol, exchange, interval, drawings);
                        logger.debug('[ChartComponent] Auto-saved', drawings.length, 'drawings');
                    }
                } catch (error) {
                    logger.warn('[ChartComponent] Failed to auto-save drawings:', error);
                }
            }, 1000); // Debounce 1 second
        };

        // Connect auto-save to LineToolManager's onDrawingsChanged callback
        if (manager.setOnDrawingsChanged) {
            manager.setOnDrawingsChanged(() => {
                logger.debug('[ChartComponent] Drawing changed, triggering auto-save...');
                autoSaveDrawings();

                // Sync with parent for Object Tree
                if (onDrawingsSync && manager.exportDrawings) {
                    onDrawingsSync(manager.exportDrawings());
                }
            });
        }

        // Store autoSave function for external access
        manager._autoSaveDrawings = autoSaveDrawings;

        return () => {
            isMounted = false; // Cancel async operations
            if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
            // Unset the drawings changed callback to prevent memory leaks
            if (manager && manager.setOnDrawingsChanged) {
                manager.setOnDrawingsChanged(null);
            }
        };
    }, [manager, symbol, exchange, interval, onDrawingsSync]);
};

