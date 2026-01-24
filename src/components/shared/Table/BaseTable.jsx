import React from 'react';
import PropTypes from 'prop-types';
import styles from './BaseTable.module.css';

/**
 * BaseTable Component
 * A reusable table component for standardizing tables across the application.
 * Supports sorting, custom cell rendering, row clicking, and empty states.
 */
const BaseTable = ({
    columns,
    data,
    keyField = 'id',
    onRowClick,
    onSort,
    sortConfig = { key: null, direction: 'asc' },
    isLoading = false,
    emptyState,
    rowClassName,
    className = '',
}) => {
    // Helper to get alignment class
    const getAlignClass = (align) => {
        switch (align) {
            case 'right': return styles.alignRight;
            case 'center': return styles.alignCenter;
            default: return styles.alignLeft;
        }
    };

    // Helper to handle sort click
    const handleSortClick = (key) => {
        if (onSort) {
            onSort(key);
        }
    };

    const renderSortIndicator = (columnKey) => {
        if (sortConfig.key !== columnKey) return null;
        return (
            <span className={`${styles.sortIndicator} ${styles.active}`}>
                {sortConfig.direction === 'asc' ? '↑' : '↓'}
            </span>
        );
    };

    if (isLoading) {
        return (
            <div className={`${styles.tableContainer} ${className}`}>
                <div className={styles.loadingContainer}>
                    <div className={styles.spinner}></div>
                    <span>Loading data...</span>
                </div>
            </div>
        );
    }

    if (!data || data.length === 0) {
        return (
            <div className={`${styles.tableContainer} ${className}`}>
                {emptyState || (
                    <div className={styles.emptyState}>
                        <div className={styles.emptyIcon}>📊</div>
                        <p className={styles.emptyText}>No data available</p>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className={`${styles.tableContainer} ${className}`}>
            <div className={styles.tableWrapper}>
                <table className={styles.table}>
                    <colgroup>
                        {columns.map((col, index) => (
                            <col
                                key={col.key || index}
                                style={{ width: col.width || 'auto' }}
                            />
                        ))}
                    </colgroup>
                    <thead>
                        <tr>
                            {columns.map((col, index) => {
                                const isSortable = col.sortable !== false && !!onSort; // Default sortable unless explicitly false
                                const isSorted = sortConfig.key === col.key;

                                return (
                                    <th
                                        key={col.key || index}
                                        className={`
                                            ${getAlignClass(col.align)}
                                            ${isSortable ? styles.sortableHeader : ''}
                                            ${isSorted ? styles.sorted : ''}
                                        `}
                                        onClick={isSortable ? () => handleSortClick(col.key) : undefined}
                                        title={isSortable ? 'Click to sort' : undefined}
                                    >
                                        {col.title}
                                        {isSortable && renderSortIndicator(col.key)}
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((row, rowIndex) => {
                            const rowKey = row[keyField] || rowIndex;
                            const customRowClass = rowClassName ? rowClassName(row) : '';

                            return (
                                <tr
                                    key={rowKey}
                                    className={`
                                        ${onRowClick ? styles.clickableRow : ''}
                                        ${customRowClass}
                                    `}
                                    onClick={onRowClick ? (e) => onRowClick(row, e) : undefined}
                                >
                                    {columns.map((col, colIndex) => {
                                        const cellValue = row[col.key];
                                        const cellContent = col.render ? col.render(row, cellValue) : cellValue;

                                        return (
                                            <td
                                                key={`${rowKey}-${col.key || colIndex}`}
                                                className={getAlignClass(col.align)}
                                            >
                                                {cellContent}
                                            </td>
                                        );
                                    })}
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

BaseTable.propTypes = {
    columns: PropTypes.arrayOf(PropTypes.shape({
        key: PropTypes.string,
        title: PropTypes.node.isRequired,
        width: PropTypes.string,
        align: PropTypes.oneOf(['left', 'center', 'right']),
        render: PropTypes.func,
        sortable: PropTypes.bool,
    })).isRequired,
    data: PropTypes.array.isRequired,
    keyField: PropTypes.oneOfType([PropTypes.string, PropTypes.func]),
    onRowClick: PropTypes.func,
    onSort: PropTypes.func,
    sortConfig: PropTypes.shape({
        key: PropTypes.string,
        direction: PropTypes.oneOf(['asc', 'desc'])
    }),
    isLoading: PropTypes.bool,
    emptyState: PropTypes.node,
    rowClassName: PropTypes.func,
    className: PropTypes.string,
};

export { BaseTable };
