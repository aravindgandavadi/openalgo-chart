/**
 * useTableFiltering Hook
 * Consolidates filter, search, and sort logic for AccountPanel tables
 * Eliminates duplicate code across OrdersTable, PositionsTable, TradesTable, HoldingsTable, ClosedPositionsTable
 */

import { useState, useMemo, useCallback } from 'react';

/**
 * @typedef {Object} SortConfig
 * @property {string|null} key - Column key to sort by
 * @property {'asc'|'desc'} direction - Sort direction
 */

/**
 * @typedef {Object} FilterConfig
 * @property {string} key - The data field to filter on
 * @property {string} dataKey - Optional different key to read from data (defaults to key)
 */

/**
 * Custom hook for table filtering, searching, and sorting
 *
 * @param {Object} options - Hook options
 * @param {Array} options.data - The data array to filter/sort
 * @param {Object} options.initialFilters - Initial filter state (e.g., { action: [], status: [] })
 * @param {Array<FilterConfig>} options.filterConfigs - Array of filter configurations
 * @param {string} options.searchField - Field to search on (default: 'symbol')
 * @param {Function} options.defaultSort - Optional default sort function
 * @returns {Object} Filter state and handlers
 */
const useTableFiltering = ({
    data = [],
    initialFilters = {},
    filterConfigs = [],
    searchField = 'symbol',
    defaultSort = null,
}) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [filters, setFilters] = useState(initialFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

    // Generate unique values for each filter
    const uniqueFilterValues = useMemo(() => {
        const result = {};
        filterConfigs.forEach(({ key, dataKey }) => {
            const fieldKey = dataKey || key;
            result[key] = [...new Set(data.map(item => item[fieldKey]).filter(Boolean))];
        });
        return result;
    }, [data, filterConfigs]);

    // Filter and sort data
    const filteredData = useMemo(() => {
        let filtered = data.filter(item => {
            // Search filter
            const matchesSearch = !searchTerm ||
                item[searchField]?.toLowerCase().includes(searchTerm.toLowerCase());

            // Apply all configured filters
            const matchesFilters = filterConfigs.every(({ key, dataKey }) => {
                const fieldKey = dataKey || key;
                const filterValues = filters[key] || [];
                return filterValues.length === 0 || filterValues.includes(item[fieldKey]);
            });

            return matchesSearch && matchesFilters;
        });

        // Apply sorting if configured
        if (sortConfig.key) {
            filtered = sortData(filtered, sortConfig);
        } else if (defaultSort) {
            filtered = defaultSort(filtered);
        }

        return filtered;
    }, [data, searchTerm, filters, sortConfig, filterConfigs, searchField, defaultSort]);

    // Handle filter toggle
    const handleFilterToggle = useCallback((filterType, value) => {
        setFilters(prev => {
            const currentFilters = prev[filterType] || [];
            const newFilters = currentFilters.includes(value)
                ? currentFilters.filter(v => v !== value)
                : [...currentFilters, value];
            return { ...prev, [filterType]: newFilters };
        });
    }, []);

    // Clear all filters
    const handleClearFilters = useCallback(() => {
        setSearchTerm('');
        setFilters(initialFilters);
    }, [initialFilters]);

    // Handle column sorting
    const handleSort = useCallback((key) => {
        setSortConfig(prev => ({
            key,
            direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
        }));
    }, []);

    // Toggle filter panel visibility
    const toggleFilters = useCallback(() => {
        setShowFilters(prev => !prev);
    }, []);

    // Check if any filters are active
    const hasActiveFilters = useMemo(() => {
        if (searchTerm) return true;
        return Object.values(filters).some(arr => arr && arr.length > 0);
    }, [searchTerm, filters]);

    // Get active filter count
    const activeFilterCount = useMemo(() => {
        return Object.values(filters).reduce((sum, arr) => sum + (arr?.length || 0), 0);
    }, [filters]);

    return {
        // State
        searchTerm,
        setSearchTerm,
        filters,
        showFilters,
        sortConfig,
        filteredData,
        uniqueFilterValues,
        hasActiveFilters,
        activeFilterCount,

        // Handlers
        handleFilterToggle,
        handleClearFilters,
        handleSort,
        toggleFilters,
    };
};

/**
 * Sort data array by a specific key
 * @param {Array} data - Data array to sort
 * @param {SortConfig} sortConfig - Sort configuration
 * @returns {Array} Sorted data array
 */
const sortData = (data, sortConfig) => {
    if (!sortConfig || !sortConfig.key) return data;

    return [...data].sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];

        // Handle null/undefined values
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Try to parse as numbers if strings contain numeric values
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);
        if (!isNaN(aNum) && !isNaN(bNum)) {
            return sortConfig.direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (sortConfig.direction === 'asc') {
            return aStr.localeCompare(bStr);
        } else {
            return bStr.localeCompare(aStr);
        }
    });
};

export default useTableFiltering;
export { sortData };
