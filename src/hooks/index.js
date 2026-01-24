// Responsive design hooks
export {
  useMediaQuery,
  useIsMobile,
  useIsTablet,
  useIsDesktop,
  useIsTouchDevice,
  usePrefersReducedMotion,
  usePrefersHighContrast,
  BREAKPOINTS,
} from './useMediaQuery';

// Accessibility hooks
export { useFocusTrap } from './useFocusTrap';
export { useKeyboardNav, useListNavigation } from './useKeyboardNav';

// Drawing tool hooks
export {
    useDrawingProperties,
    DEFAULT_DRAWING_OPTIONS,
    LINE_STYLES,
    PRESET_COLORS,
} from './useDrawingProperties';

// Symbol history hooks
export { useSymbolHistory } from './useSymbolHistory';

// Command palette hooks
export {
    useCommandPalette,
    COMMAND_CATEGORIES,
    CATEGORY_CONFIG,
} from './useCommandPalette';

// Global keyboard shortcuts
export { useGlobalShortcuts } from './useGlobalShortcuts';

// Web Worker hooks
export { useIndicatorWorker } from './useIndicatorWorker';

// Option Chain data hooks
export { useOptionChainData } from './useOptionChainData';

// Virtual scrolling hooks
export { useVirtualScroll, VirtualList } from './useVirtualScroll.jsx';

// Table filtering hook (consolidates filter/sort logic for AccountPanel tables)
export { default as useTableFiltering, sortData } from './useTableFiltering';

// Order form state hook (consolidates modal state for order forms)
export { default as useOrderFormState } from './useOrderFormState';
