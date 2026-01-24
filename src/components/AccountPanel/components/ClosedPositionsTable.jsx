/**
 * ClosedPositionsTable Component
 * Renders closed positions (quantity === 0) with realized P&L
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import styles from '../AccountPanel.module.css';
import { formatCurrency, sortData, formatClosedTime } from '../utils/accountFormatters';
import { BaseTable } from '../../shared';

const ClosedPositionsTable = ({ positions, onRowClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        exchange: [],
        product: []
    });
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: 'timestamp', direction: 'desc' });

    // Get unique values for filters
    const uniqueExchanges = useMemo(() => {
        return [...new Set(positions.filter(p => p.quantity === 0).map(p => p.exchange).filter(Boolean))];
    }, [positions]);

    const uniqueProducts = useMemo(() => {
        return [...new Set(positions.filter(p => p.quantity === 0).map(p => p.product).filter(Boolean))];
    }, [positions]);

    // Filter and sort closed positions
    const filteredPositions = useMemo(() => {
        const filtered = positions
            .filter(p => p.quantity === 0) // Only closed positions
            .filter(p => {
                // Search filter
                const matchesSearch = !searchTerm ||
                    p.symbol?.toLowerCase().includes(searchTerm.toLowerCase());

                // Exchange filter
                const matchesExchange = filters.exchange.length === 0 ||
                    filters.exchange.includes(p.exchange);

                // Product filter
                const matchesProduct = filters.product.length === 0 ||
                    filters.product.includes(p.product);

                return matchesSearch && matchesExchange && matchesProduct;
            });

        // Apply sorting if configured, otherwise sort by timestamp (most recent first)
        if (sortConfig.key) {
            return sortData(filtered, sortConfig);
        }
        return filtered.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    }, [positions, searchTerm, filters, sortConfig]);

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
        setFilters({ exchange: [], product: [] });
    }, []);

    // Handle column sorting
    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const hasActiveFilters = searchTerm || filters.exchange.length > 0 || filters.product.length > 0;

    // Define columns for BaseTable
    const columns = useMemo(() => [
        {
            key: 'symbol',
            title: 'Symbol',
            width: '18%',
            sortable: true,
            render: (row) => <span className={styles.symbolCell}>{row.symbol}</span>
        },
        { key: 'exchange', title: 'Exchange', width: '10%' },
        { key: 'product', title: 'Product', width: '10%' },
        {
            key: 'average_price',
            title: 'Entry Price',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => formatCurrency(parseFloat(row.average_price || 0))
        },
        {
            key: 'ltp',
            title: 'Exit Price',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => formatCurrency(parseFloat(row.ltp || 0))
        },
        {
            key: 'day_pnl',
            title: 'Day P&L',
            width: '13%',
            align: 'right',
            sortable: true,
            render: (row) => {
                const dayPnl = parseFloat(row.day_pnl || row.pnl || 0);
                return (
                    <span className={dayPnl >= 0 ? styles.positive : styles.negative}>
                        {dayPnl >= 0 ? '+' : ''}{formatCurrency(dayPnl)}
                    </span>
                );
            }
        },
        {
            key: 'pnl',
            title: 'Overall P&L',
            width: '13%',
            align: 'right',
            sortable: true,
            render: (row) => {
                const overallPnl = parseFloat(row.pnl || 0);
                return (
                    <span className={overallPnl >= 0 ? styles.positive : styles.negative}>
                        {overallPnl >= 0 ? '+' : ''}{formatCurrency(overallPnl)}
                    </span>
                );
            }
        },
        {
            key: 'timestamp',
            title: 'Closed At',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => (
                <span className={styles.timeCell}>
                    {formatClosedTime(row.timestamp)}
                </span>
            )
        }
    ], []);

    // Create custom row click handler
    const handleRowClick = useCallback((row) => {
        if (onRowClick) {
            onRowClick(row.symbol, row.exchange);
        }
    }, [onRowClick]);

    if (positions.filter(p => p.quantity === 0).length === 0) {
        return (
            <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>📊</span>
                <p>No closed positions</p>
            </div>
        );
    }

    return (
        <div className={`${styles.tableContainer} ${styles.closedPositionsTable}`}>
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
                        {filters.exchange.length + filters.product.length}
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

                    <div className={styles.filterGroup}>
                        <label>Product</label>
                        <div className={styles.filterOptions}>
                            {uniqueProducts.map(product => (
                                <label key={product} className={styles.filterOption}>
                                    <input
                                        type="checkbox"
                                        checked={filters.product.includes(product)}
                                        onChange={() => handleFilterToggle('product', product)}
                                    />
                                    <span>{product}</span>
                                </label>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Results Count */}
            {hasActiveFilters && (
                <div className={styles.resultsCount}>
                    Showing {filteredPositions.length} of {positions.filter(p => p.quantity === 0).length} closed positions
                </div>
            )}

            {/* Use BaseTable */}
            <BaseTable
                columns={columns}
                data={filteredPositions}
                onSort={handleSort}
                sortConfig={sortConfig}
                onRowClick={handleRowClick}
                keyField={(row) => `${row.symbol}-${row.exchange}-${row.timestamp}`}
                emptyState={
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <p>No closed positions match your filters</p>
                        <button className={styles.clearFiltersBtn} onClick={handleClearFilters}>
                            Clear Filters
                        </button>
                    </div>
                }
            />
        </div>
    );
};

export default React.memo(ClosedPositionsTable);
