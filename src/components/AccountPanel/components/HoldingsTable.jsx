/**
 * HoldingsTable Component
 * Renders the holdings table for AccountPanel with search and filter
 */
import React, { useState, useMemo, useCallback } from 'react';
import { Search, X, Filter } from 'lucide-react';
import styles from '../AccountPanel.module.css';
import { formatCurrency, sortData } from '../utils/accountFormatters';
import { BaseTable } from '../../shared';

const HoldingsTable = ({ holdings, onRowClick }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState({
        exchange: []
    });
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Get unique values for filters
    const uniqueExchanges = useMemo(() => {
        return [...new Set(holdings.map(h => h.exchange).filter(Boolean))];
    }, [holdings]);

    // Filter and sort holdings
    const sortedHoldings = useMemo(() => {
        const filtered = holdings
            .filter(holding => {
                // Search filter
                const matchesSearch = !searchTerm ||
                    holding.symbol?.toLowerCase().includes(searchTerm.toLowerCase());

                // Exchange filter
                const matchesExchange = filters.exchange.length === 0 ||
                    filters.exchange.includes(holding.exchange);

                return matchesSearch && matchesExchange;
            });

        // Apply sorting if configured, otherwise sort by timestamp
        if (sortConfig.key) {
            return sortData(filtered, sortConfig);
        }
        return filtered.sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));
    }, [holdings, searchTerm, filters, sortConfig]);

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
        setFilters({ exchange: [] });
    }, []);

    // Handle column sorting
    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    const hasActiveFilters = searchTerm || filters.exchange.length > 0;

    // Define columns for BaseTable
    const columns = useMemo(() => [
        {
            key: 'symbol',
            title: 'Symbol',
            width: '20%',
            sortable: true,
            render: (row) => <span className={styles.symbolCell}>{row.symbol}</span>
        },
        { key: 'exchange', title: 'Exchange', width: '10%' },
        {
            key: 'quantity',
            title: 'Qty',
            width: '10%',
            align: 'right',
            sortable: true
        },
        {
            key: 'avgCost',
            title: 'Avg Cost',
            width: '12%',
            align: 'right',
            render: (row) => {
                const pnl = parseFloat(row.pnl || 0);
                const ltp = parseFloat(row.close || row.ltp || 0);
                const qty = parseFloat(row.quantity || 0);
                const currentValue = ltp * qty;
                const costValue = currentValue - pnl;
                const avgCost = qty > 0 ? costValue / qty : 0;
                return formatCurrency(avgCost);
            }
        },
        {
            key: 'ltp',
            title: 'LTP',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => formatCurrency(parseFloat(row.close || row.ltp || 0))
        },
        {
            key: 'value',
            title: 'Value',
            width: '12%',
            align: 'right',
            render: (row) => {
                const ltp = parseFloat(row.close || row.ltp || 0);
                const qty = parseFloat(row.quantity || 0);
                const currentValue = ltp * qty;
                return formatCurrency(currentValue);
            }
        },
        {
            key: 'pnl',
            title: 'P&L',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => {
                const pnl = parseFloat(row.pnl || 0);
                return (
                    <span className={pnl >= 0 ? styles.positive : styles.negative}>
                        {pnl >= 0 ? '+' : ''}{formatCurrency(pnl)}
                    </span>
                );
            }
        },
        {
            key: 'pnlpercent',
            title: 'P&L %',
            width: '12%',
            align: 'right',
            sortable: true,
            render: (row) => {
                const pnlPercent = parseFloat(row.pnlpercent || 0);
                return (
                    <span className={pnlPercent >= 0 ? styles.positive : styles.negative}>
                        {pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(2)}%
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

    if (holdings.length === 0) {
        return (
            <div className={styles.emptyState}>
                <span className={styles.emptyIcon}>💼</span>
                <p>No holdings found in your demat account</p>
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
                        {filters.exchange.length}
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
                </div>
            )}

            {/* Results Count */}
            {hasActiveFilters && (
                <div className={styles.resultsCount}>
                    Showing {sortedHoldings.length} of {holdings.length} holdings
                </div>
            )}

            {/* Use BaseTable */}
            <BaseTable
                columns={columns}
                data={sortedHoldings}
                onSort={handleSort}
                sortConfig={sortConfig}
                onRowClick={handleRowClick}
                keyField="symbol"
                emptyState={
                    <div className={styles.emptyState}>
                        <span className={styles.emptyIcon}>🔍</span>
                        <p>No holdings match your filters</p>
                        <button className={styles.clearFiltersBtn} onClick={handleClearFilters}>
                            Clear Filters
                        </button>
                    </div>
                }
            />
        </div>
    );
};

export default React.memo(HoldingsTable);
