/**
 * TradesTable Component
 * Renders the trades table for AccountPanel with search and filter
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import styles from '../AccountPanel.module.css';
import { formatCurrency, sortData } from '../utils/accountFormatters';
import { BaseTable } from '../../shared';

const TradesTable = ({ trades, onRowClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        action: [],
        exchange: []
    });
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Get unique values for filters
    const uniqueActions = useMemo(() => {
        return [...new Set(trades.map(t => t.action).filter(Boolean))];
    }, [trades]);

    const uniqueExchanges = useMemo(() => {
        return [...new Set(trades.map(t => t.exchange).filter(Boolean))];
    }, [trades]);

    // Filter and sort trades
    const sortedTrades = useMemo(() => {
        const filtered = trades
            .filter(trade => {
                // Search filter
                const matchesSearch = !searchTerm ||
                    trade.symbol?.toLowerCase().includes(searchTerm.toLowerCase());

                // Action filter
                const matchesAction = filters.action.length === 0 ||
                    filters.action.includes(trade.action);

                // Exchange filter
                const matchesExchange = filters.exchange.length === 0 ||
                    filters.exchange.includes(trade.exchange);

                return matchesSearch && matchesAction && matchesExchange;
            });

        // Apply sorting if configured, otherwise sort by timestamp
        if (sortConfig.key) {
            return sortData(filtered, sortConfig);
        }
        return filtered.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    }, [trades, searchTerm, filters, sortConfig]);

    // Handle filter toggle
    const handleFilterToggle = useCallback((filterType, value) => {
        setFilters(prev => {
            const currentFilters = prev[filterType];
            const newFilters = currentFilters.includes(value)
                ? currentFilters.filter(v => v !== value)
                : [...currentFilters, value];
            return { ...prev, [filterType]: newFilters };
        });
    }, []);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setFilters({ action: [], exchange: [] });
    }, []);

    // Handle column sorting
    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const hasActiveFilters = searchTerm || filters.action.length > 0 || filters.exchange.length > 0;

    // Define columns for BaseTable
    const columns = useMemo(() => [
        {
            key: 'timestamp',
            title: 'Time',
            width: '15%',
            sortable: true,
            render: (row) => <span className={styles.timeCell}>{row.timestamp}</span>
        },
        {
            key: 'symbol',
            title: 'Symbol',
            width: '20%',
            sortable: true,
            render: (row) => <span className={styles.symbolCell}>{row.symbol}</span>
        },
        {
            key: 'action',
            title: 'Action',
            width: '8%',
            render: (row) => (
                <span className={row.action === 'BUY' ? styles.positive : styles.negative}>
                    {row.action}
                </span>
            )
        },
        {
            key: 'quantity',
            title: 'Qty',
            width: '8%',
            align: 'right',
            sortable: true
        },
        {
            key: 'average_price',
            title: 'Avg Price',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => formatCurrency(row.average_price)
        },
        {
            key: 'trade_value',
            title: 'Value',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => {
                const tradeValue = parseFloat(row.trade_value || 0);
                return `₹${formatCurrency(tradeValue)}`;
            }
        },
        {
            key: 'charges',
            title: 'Charges',
            width: '10%',
            align: 'right',
            render: (row) => {
                const charges = parseFloat(row.charges || row.brokerage || row.fees || 0);
                return (
                    <span className={styles.negative}>
                        {charges > 0 ? `-${formatCurrency(charges)}` : '-'}
                    </span>
                );
            }
        },
        {
            key: 'tradeId',
            title: 'Trade ID',
            width: '15%',
            align: 'right',
            render: (row) => {
                const tradeId = row.tradeid || row.trade_id || row.orderid || '-';
                return (
                    <span className={styles.tradeId} title={tradeId}>
                        {tradeId.length > 12 ? `${tradeId.substring(0, 12)}...` : tradeId}
                    </span>
                );
            }
        }
    ], []);

    // Create custom row click handler
    const handleRowClick = useCallback((row) => {
        if (onRowClick) {
            onRowClick(row.symbol, row.exchange);
        }
    }, [onRowClick]);

    if (trades.length === 0) {
        return (
            <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📈</span>
                <p>No trades executed today</p>
            </div>
        );
    }

    return (
        <div className={styles.tableContainer}>
            {/* Search and Filter Bar */}
            <div className={styles.tableControls}>
                <div className={styles.searchBar}>
                    <Search size={14} className={styles.searchIcon} />
                    <input
                        type="text"
                        placeholder="Search symbol..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className={styles.searchInput}
                    />
                    {searchTerm && (
                        <X
                            size={14}
                            className={styles.clearIcon}
                            onClick={() => setSearchTerm('')}
                        />
                    )}
                </div>

                <button
                    className={`${styles.filterBtn} ${hasActiveFilters ? styles.filterActive : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                    title="Toggle filters"
                >
                    <Filter size={14} />
                    <span>Filters</span>
                    {hasActiveFilters && <span className={styles.filterCount}>
                        {filters.action.length + filters.exchange.length}
                    </span>}
                </button>

                {hasActiveFilters && (
                    <button
                        className={styles.clearFiltersBtn}
                        onClick={handleClearFilters}
                        title="Clear all filters"
                    >
                        <X size={12} />
                        <span>Clear</span>
                    </button>
                )}
            </div>

            {/* Filter Dropdowns */}
            {showFilters && (
                <div className={styles.filterPanel}>
                    <div className={styles.filterGroup}>
                        <label>Action</label>
                        <div className={styles.filterOptions}>
                            {uniqueActions.map(action => (
                                <label key={action} className={styles.filterOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.action.includes(action)}
                                        onChange={() => handleFilterToggle('action', action)}
                                    />
                                    <span>{action}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <div className={styles.filterGroup}>
                        <label>Exchange</label>
                        <div className={styles.filterOptions}>
                            {uniqueExchanges.map(exchange => (
                                <label key={exchange} className={styles.filterOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.exchange.includes(exchange)}
                                        onChange={() => handleFilterToggle('exchange', exchange)}
                                    />
                                    <span>{exchange}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            {hasActiveFilters && (
                <div className={styles.resultsCount}>
                    Showing {sortedTrades.length} of {trades.length} trades
                </div>
            )}

            {/* Use BaseTable */}
            {/* Use composite key for trades since they might not have unique IDs */}
            <BaseTable
                columns={columns}
                data={sortedTrades}
                onSort={handleSort}
                sortConfig={sortConfig}
                onRowClick={handleRowClick}
                keyField={(row) => `${row.orderid || 'trade'}-${row.timestamp || ''}`}
                emptyState={
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <p>No trades match your filters</p>
                        <button className={styles.clearFiltersBtn} onClick={handleClearFilters}>
                            Clear Filters
                        </button>
                    </div>
                }
            />
        </div>
    );
};

export default React.memo(TradesTable);
