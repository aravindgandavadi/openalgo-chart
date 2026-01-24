import React from 'react';
import { BaseDropdown, DropdownItem, DropdownDivider } from '../../shared';
import styles from '../Topbar.module.css';

/**
 * Indicator Dropdown Component
 * Displays categorized list of available indicators
 */
export function IndicatorDropdown({ position, onAddIndicator, onClose }) {
    const handleClick = (indicator) => {
        onAddIndicator(indicator);
        // Dont close automatically to allow adding multiple indicators
    };

    const SectionHeader = ({ children }) => (
        <div className={styles.dropdownSection}>{children}</div>
    );

    const IndicatorItem = ({ id, label }) => (
        <DropdownItem
            label={label}
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                handleClick(id);
            }}
        />
    );

    return (
        <BaseDropdown
            isOpen={true}
            onClose={onClose}
            position={{ top: position.top, left: position.left }}
            width={220}
            className={styles.indicatorDropdown}
        >
            <SectionHeader>Moving Averages</SectionHeader>
            <IndicatorItem id="sma" label="SMA" />
            <IndicatorItem id="ema" label="EMA" />

            <DropdownDivider />
            <SectionHeader>Oscillators</SectionHeader>
            <IndicatorItem id="rsi" label="RSI" />
            <IndicatorItem id="stochastic" label="Stochastic" />
            <IndicatorItem id="hilengaMilenga" label="Hilenga-Milenga" />

            <DropdownDivider />
            <SectionHeader>Momentum</SectionHeader>
            <IndicatorItem id="macd" label="MACD" />

            <DropdownDivider />
            <SectionHeader>Volatility</SectionHeader>
            <IndicatorItem id="bollingerBands" label="Bollinger Bands" />
            <IndicatorItem id="atr" label="ATR" />

            <DropdownDivider />
            <SectionHeader>Trend</SectionHeader>
            <IndicatorItem id="supertrend" label="Supertrend" />
            <IndicatorItem id="ichimoku" label="Ichimoku Cloud" />

            <DropdownDivider />
            <SectionHeader>Trend Strength</SectionHeader>
            <IndicatorItem id="adx" label="ADX" />

            <DropdownDivider />
            <SectionHeader>Support/Resistance</SectionHeader>
            <IndicatorItem id="pivotPoints" label="Pivot Points" />

            <DropdownDivider />
            <SectionHeader>Volume</SectionHeader>
            <IndicatorItem id="volume" label="Volume" />
            <IndicatorItem id="vwap" label="VWAP" />

            <DropdownDivider />
            <SectionHeader>Market Profile</SectionHeader>
            <IndicatorItem id="tpo" label="TPO Profile (30m)" />

            <DropdownDivider />
            <SectionHeader>Strategy</SectionHeader>
            <IndicatorItem id="firstCandle" label="First Red Candle" />
            <IndicatorItem id="rangeBreakout" label="Range Breakout" />
            <IndicatorItem id="annStrategy" label="ANN Strategy" />

            <DropdownDivider />
            <SectionHeader>Risk Management</SectionHeader>
            <IndicatorItem id="riskCalculator" label="Risk Calculator" />
        </BaseDropdown>
    );
}

export default IndicatorDropdown;

