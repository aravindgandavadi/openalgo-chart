import React from 'react';
import { BaseDropdown, DropdownItem } from '../../shared';

/**
 * Layout Dropdown Component
 * Allows selection of chart layout configuration
 */
export function LayoutDropdown({ position, layout, onLayoutChange, onClose }) {
    const layouts = [
        {
            value: '1',
            label: 'Single Chart',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
                    <path fill="currentColor" d="M3 3h22v22H3V3z"></path>
                </svg>
            ),
        },
        {
            value: '2',
            label: '2 Charts',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
                    <path fill="currentColor" d="M3 3h10v22H3V3zm12 0h10v22H15V3z"></path>
                </svg>
            ),
        },
        {
            value: '3',
            label: '3 Charts',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
                    <path fill="currentColor" d="M3 3h6v22H3V3zm8 0h6v22h-6V3zm8 0h6v22h-6V3z"></path>
                </svg>
            ),
        },
        {
            value: '4',
            label: '4 Charts',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28" width="28" height="28">
                    <path fill="currentColor" d="M3 3h10v10H3V3zm12 0h10v10H15V3zM3 15h10v10H3V15zm12 0h10v10H15V15z"></path>
                </svg>
            ),
        },
    ];

    return (
        <BaseDropdown
            isOpen={true}
            onClose={onClose}
            position={{ top: position.top, left: position.left }}
            width={200}
        >
            {layouts.map((item) => (
                <DropdownItem
                    key={item.value}
                    icon={item.icon}
                    label={item.label}
                    active={layout === item.value}
                    onClick={() => {
                        onLayoutChange(item.value);
                        onClose();
                    }}
                />
            ))}
        </BaseDropdown>
    );
}

export default LayoutDropdown;

