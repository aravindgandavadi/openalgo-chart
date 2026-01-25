import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getDepth } from '../../services/openalgo';
import { X, RefreshCw, Layers } from 'lucide-react';
import styles from './DepthOfMarket.module.css';
import logger from '../../utils/logger';
import { formatCompactNumber, formatPrice } from '../../utils/shared/formatters';

interface DepthLevel {
    price: number;
    quantity: number;
}

interface DepthData {
    asks: DepthLevel[];
    bids: DepthLevel[];
    ltp: number;
    ltq: number;
    totalBuyQty: number;
    totalSellQty: number;
    volume: number;
    oi: number;
    high: number;
    low: number;
}

export interface DepthOfMarketProps {
    symbol: string;
    exchange?: string;
    isOpen: boolean;
    onClose: () => void;
}

/**
 * Depth of Market (DOM) Panel
 * Displays 5 best bid/ask levels with price ladder visualization
 */
const DepthOfMarket: React.FC<DepthOfMarketProps> = ({ symbol, exchange = 'NSE', isOpen, onClose }) => {
    const [depth, setDepth] = useState<DepthData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const abortControllerRef = useRef<AbortController | null>(null);

    // Fetch depth data
    const fetchDepth = useCallback(async (): Promise<void> => {
        if (!symbol || isPaused) return;

        // Abort previous request if still pending
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();

        try {
            const data = await getDepth(symbol, exchange, abortControllerRef.current.signal);
            if (data) {
                setDepth(data as DepthData);
                setError(null);
            }
        } catch (err: unknown) {
            if (err instanceof Error && err.name !== 'AbortError') {
                setError('Failed to fetch depth');
                logger.error('Depth fetch error:', err);
            }
        }
    }, [symbol, exchange, isPaused]);

    // Initial fetch and polling - pauses when tab is not visible to save CPU
    useEffect(() => {
        if (!isOpen || !symbol) return;

        const startPolling = () => {
            if (intervalRef.current) return; // Already polling
            intervalRef.current = setInterval(fetchDepth, 1000); // Poll every 1s (reduced from 500ms)
        };

        const stopPolling = () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                stopPolling();
            } else if (isOpen && !isPaused) {
                fetchDepth(); // Immediate refresh when becoming visible
                startPolling();
            }
        };

        setIsLoading(true);
        fetchDepth().finally(() => setIsLoading(false));

        // Only start polling if tab is visible
        if (document.visibilityState !== 'hidden') {
            startPolling();
        }

        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            stopPolling();
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, [isOpen, symbol, isPaused, fetchDepth]);

    // Format number with commas and crushing
    const formatNumber = (num: number): string => formatCompactNumber(num, 2);

    // Format price
    const formatPriceDisplay = (price: number): string => formatPrice(price, 2);

    // Calculate max quantity for bar width scaling
    const getMaxQuantity = (): number => {
        if (!depth) return 1;
        const allQtys = [
            ...depth.asks.map(a => a.quantity),
            ...depth.bids.map(b => b.quantity)
        ];
        return Math.max(...allQtys, 1);
    };

    if (!isOpen) return null;

    const maxQty = getMaxQuantity();

    return (
        <div className={styles.container}>
            {/* Header */}
            <div className={styles.header}>
                <div className={styles.title}>
                    <Layers size={16} />
                    <span>Depth of Market</span>
                </div>
                <div className={styles.headerActions}>
                    <button
                        className={`${styles.iconBtn} ${isPaused ? styles.paused : ''}`}
                        onClick={() => setIsPaused(!isPaused)}
                        title={isPaused ? 'Resume' : 'Pause'}
                    >
                        <RefreshCw size={14} className={!isPaused ? styles.spinning : ''} />
                    </button>
                    <button className={styles.iconBtn} onClick={onClose} title="Close">
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Symbol Info */}
            <div className={styles.symbolInfo}>
                <span className={styles.symbolName}>{symbol}</span>
                <span className={styles.exchange}>{exchange}</span>
            </div>

            {/* Loading/Error States */}
            {isLoading && !depth && (
                <div className={styles.loading}>Loading...</div>
            )}
            {error && (
                <div className={styles.error}>{error}</div>
            )}

            {/* Depth Table */}
            {depth && (
                <>
                    {/* Column Headers */}
                    <div className={styles.columnHeaders}>
                        <span className={styles.bidHeader}>BID QTY</span>
                        <span className={styles.priceHeader}>PRICE</span>
                        <span className={styles.askHeader}>ASK QTY</span>
                    </div>

                    {/* Price Ladder */}
                    <div className={styles.ladder}>
                        {/* Ask rows (reversed to show highest at top) */}
                        {[...depth.asks].reverse().map((ask, idx) => (
                            <div key={`ask-${idx}`} className={styles.row}>
                                <div className={styles.bidCell}></div>
                                <div className={styles.priceCell}>
                                    <span className={styles.askPrice}>{formatPriceDisplay(ask.price)}</span>
                                </div>
                                <div className={styles.askCell}>
                                    <div
                                        className={styles.askBar}
                                        style={{ width: `${(ask.quantity / maxQty) * 100}%` }}
                                    />
                                    <span className={styles.qty}>{formatNumber(ask.quantity)}</span>
                                </div>
                            </div>
                        ))}

                        {/* LTP Separator */}
                        <div className={styles.ltpRow}>
                            <div className={styles.ltpLine}></div>
                            <div className={styles.ltpBadge}>
                                <span>LTP</span>
                                <strong>{formatPriceDisplay(depth.ltp)}</strong>
                                {depth.ltq > 0 && <span className={styles.ltq}>x{formatNumber(depth.ltq)}</span>}
                            </div>
                            <div className={styles.ltpLine}></div>
                        </div>

                        {/* Bid rows */}
                        {depth.bids.map((bid, idx) => (
                            <div key={`bid-${idx}`} className={styles.row}>
                                <div className={styles.bidCell}>
                                    <div
                                        className={styles.bidBar}
                                        style={{ width: `${(bid.quantity / maxQty) * 100}%` }}
                                    />
                                    <span className={styles.qty}>{formatNumber(bid.quantity)}</span>
                                </div>
                                <div className={styles.priceCell}>
                                    <span className={styles.bidPrice}>{formatPriceDisplay(bid.price)}</span>
                                </div>
                                <div className={styles.askCell}></div>
                            </div>
                        ))}
                    </div>

                    {/* Summary Footer */}
                    <div className={styles.summary}>
                        <div className={styles.summaryItem}>
                            <span className={styles.buyLabel}>Total Buy</span>
                            <span className={styles.buyValue}>{formatNumber(depth.totalBuyQty)}</span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.sellLabel}>Total Sell</span>
                            <span className={styles.sellValue}>{formatNumber(depth.totalSellQty)}</span>
                        </div>
                    </div>

                    {/* Additional Info */}
                    <div className={styles.footer}>
                        <div className={styles.footerItem}>
                            <span>Vol:</span>
                            <span>{formatNumber(depth.volume)}</span>
                        </div>
                        {depth.oi > 0 && (
                            <div className={styles.footerItem}>
                                <span>OI:</span>
                                <span>{formatNumber(depth.oi)}</span>
                            </div>
                        )}
                        <div className={styles.footerItem}>
                            <span>H/L:</span>
                            <span>{formatPriceDisplay(depth.high)} / {formatPriceDisplay(depth.low)}</span>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default React.memo(DepthOfMarket);
