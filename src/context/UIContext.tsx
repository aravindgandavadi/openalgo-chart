/**
 * UIContext - Modal and dialog visibility state management
 * Reduces prop drilling for UI state across the app
 */

import {
  createContext,
  useState,
  useContext,
  useCallback,
  type ReactNode,
  type Dispatch,
  type SetStateAction,
} from 'react';

// ==================== TYPES ====================

/** Search mode */
export type SearchMode = 'switch' | 'add' | 'compare';

/** Right panel type */
export type RightPanelType = 'watchlist' | 'orders' | 'positions' | 'alerts' | string;

/** UI context value */
export interface UIContextValue {
  // Search
  isSearchOpen: boolean;
  setIsSearchOpen: Dispatch<SetStateAction<boolean>>;
  searchMode: SearchMode;
  setSearchMode: Dispatch<SetStateAction<SearchMode>>;
  initialSearchValue: string;
  setInitialSearchValue: Dispatch<SetStateAction<string>>;
  openSearch: (mode?: SearchMode, initialValue?: string) => void;

  // Command palette
  isCommandPaletteOpen: boolean;
  setIsCommandPaletteOpen: Dispatch<SetStateAction<boolean>>;

  // Dialogs
  isTemplateDialogOpen: boolean;
  setIsTemplateDialogOpen: Dispatch<SetStateAction<boolean>>;
  isShortcutsDialogOpen: boolean;
  setIsShortcutsDialogOpen: Dispatch<SetStateAction<boolean>>;
  isChartTemplatesOpen: boolean;
  setIsChartTemplatesOpen: Dispatch<SetStateAction<boolean>>;
  isSettingsOpen: boolean;
  setIsSettingsOpen: Dispatch<SetStateAction<boolean>>;

  // Options
  isStraddlePickerOpen: boolean;
  setIsStraddlePickerOpen: Dispatch<SetStateAction<boolean>>;
  isOptionChainOpen: boolean;
  setIsOptionChainOpen: Dispatch<SetStateAction<boolean>>;
  optionChainInitialSymbol: string | null;
  setOptionChainInitialSymbol: Dispatch<SetStateAction<string | null>>;
  openOptionChain: (symbol?: string | null) => void;

  // Alert
  isAlertOpen: boolean;
  setIsAlertOpen: Dispatch<SetStateAction<boolean>>;

  // Sector heatmap
  isSectorHeatmapOpen: boolean;
  setIsSectorHeatmapOpen: Dispatch<SetStateAction<boolean>>;

  // Indicator settings
  isIndicatorSettingsOpen: boolean;
  setIsIndicatorSettingsOpen: Dispatch<SetStateAction<boolean>>;

  // Toolbar
  showDrawingToolbar: boolean;
  setShowDrawingToolbar: Dispatch<SetStateAction<boolean>>;

  // Right panel
  activeRightPanel: RightPanelType;
  setActiveRightPanel: Dispatch<SetStateAction<RightPanelType>>;

  // Helpers
  closeAllModals: () => void;
  closeTopmostModal: () => boolean;
  hasOpenModal: boolean;
}

// ==================== CONTEXT ====================

const UIContext = createContext<UIContextValue | null>(null);

export interface UIProviderProps {
  children: ReactNode;
}

/**
 * UIProvider - Manages all modal/dialog visibility states
 * Reduces prop drilling for UI state across the app
 */
export function UIProvider({ children }: UIProviderProps) {
  // Search modal
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchMode, setSearchMode] = useState<SearchMode>('switch');
  const [initialSearchValue, setInitialSearchValue] = useState('');

  // Command palette
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);

  // Dialogs
  const [isTemplateDialogOpen, setIsTemplateDialogOpen] = useState(false);
  const [isShortcutsDialogOpen, setIsShortcutsDialogOpen] = useState(false);
  const [isChartTemplatesOpen, setIsChartTemplatesOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Options related
  const [isStraddlePickerOpen, setIsStraddlePickerOpen] = useState(false);
  const [isOptionChainOpen, setIsOptionChainOpen] = useState(false);
  const [optionChainInitialSymbol, setOptionChainInitialSymbol] = useState<string | null>(null);

  // Alert dialog
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  // Sector heatmap
  const [isSectorHeatmapOpen, setIsSectorHeatmapOpen] = useState(false);

  // Indicator settings
  const [isIndicatorSettingsOpen, setIsIndicatorSettingsOpen] = useState(false);

  // Toolbar visibility
  const [showDrawingToolbar, setShowDrawingToolbar] = useState(true);

  // Right panel state
  const [activeRightPanel, setActiveRightPanel] = useState<RightPanelType>('watchlist');

  // Helper: Open search with specific mode
  const openSearch = useCallback((mode: SearchMode = 'switch', initialValue: string = '') => {
    setSearchMode(mode);
    setInitialSearchValue(initialValue);
    setIsSearchOpen(true);
  }, []);

  // Helper: Open option chain with symbol
  const openOptionChain = useCallback((symbol: string | null = null) => {
    setOptionChainInitialSymbol(symbol);
    setIsOptionChainOpen(true);
  }, []);

  // Helper: Close all modals (useful for Escape key)
  const closeAllModals = useCallback(() => {
    setIsSearchOpen(false);
    setIsCommandPaletteOpen(false);
    setIsTemplateDialogOpen(false);
    setIsShortcutsDialogOpen(false);
    setIsChartTemplatesOpen(false);
    setIsSettingsOpen(false);
    setIsStraddlePickerOpen(false);
    setIsOptionChainOpen(false);
    setIsAlertOpen(false);
    setIsSectorHeatmapOpen(false);
    setIsIndicatorSettingsOpen(false);
  }, []);

  // Helper: Close topmost modal (for Escape key priority)
  const closeTopmostModal = useCallback((): boolean => {
    // Priority order (most recent/topmost first)
    if (isShortcutsDialogOpen) {
      setIsShortcutsDialogOpen(false);
      return true;
    }
    if (isCommandPaletteOpen) {
      setIsCommandPaletteOpen(false);
      return true;
    }
    if (isSearchOpen) {
      setIsSearchOpen(false);
      return true;
    }
    if (isAlertOpen) {
      setIsAlertOpen(false);
      return true;
    }
    if (isSettingsOpen) {
      setIsSettingsOpen(false);
      return true;
    }
    if (isTemplateDialogOpen) {
      setIsTemplateDialogOpen(false);
      return true;
    }
    if (isChartTemplatesOpen) {
      setIsChartTemplatesOpen(false);
      return true;
    }
    if (isStraddlePickerOpen) {
      setIsStraddlePickerOpen(false);
      return true;
    }
    if (isOptionChainOpen) {
      setIsOptionChainOpen(false);
      return true;
    }
    if (isSectorHeatmapOpen) {
      setIsSectorHeatmapOpen(false);
      return true;
    }
    if (isIndicatorSettingsOpen) {
      setIsIndicatorSettingsOpen(false);
      return true;
    }
    return false; // No modal was open
  }, [
    isShortcutsDialogOpen,
    isCommandPaletteOpen,
    isSearchOpen,
    isAlertOpen,
    isSettingsOpen,
    isTemplateDialogOpen,
    isChartTemplatesOpen,
    isStraddlePickerOpen,
    isOptionChainOpen,
    isSectorHeatmapOpen,
    isIndicatorSettingsOpen,
  ]);

  // Check if any modal is open
  const hasOpenModal =
    isSearchOpen ||
    isCommandPaletteOpen ||
    isTemplateDialogOpen ||
    isShortcutsDialogOpen ||
    isChartTemplatesOpen ||
    isSettingsOpen ||
    isStraddlePickerOpen ||
    isOptionChainOpen ||
    isAlertOpen ||
    isSectorHeatmapOpen ||
    isIndicatorSettingsOpen;

  const value: UIContextValue = {
    // Search
    isSearchOpen,
    setIsSearchOpen,
    searchMode,
    setSearchMode,
    initialSearchValue,
    setInitialSearchValue,
    openSearch,

    // Command palette
    isCommandPaletteOpen,
    setIsCommandPaletteOpen,

    // Dialogs
    isTemplateDialogOpen,
    setIsTemplateDialogOpen,
    isShortcutsDialogOpen,
    setIsShortcutsDialogOpen,
    isChartTemplatesOpen,
    setIsChartTemplatesOpen,
    isSettingsOpen,
    setIsSettingsOpen,

    // Options
    isStraddlePickerOpen,
    setIsStraddlePickerOpen,
    isOptionChainOpen,
    setIsOptionChainOpen,
    optionChainInitialSymbol,
    setOptionChainInitialSymbol,
    openOptionChain,

    // Alert
    isAlertOpen,
    setIsAlertOpen,

    // Sector heatmap
    isSectorHeatmapOpen,
    setIsSectorHeatmapOpen,

    // Indicator settings
    isIndicatorSettingsOpen,
    setIsIndicatorSettingsOpen,

    // Toolbar
    showDrawingToolbar,
    setShowDrawingToolbar,

    // Right panel
    activeRightPanel,
    setActiveRightPanel,

    // Helpers
    closeAllModals,
    closeTopmostModal,
    hasOpenModal,
  };

  return <UIContext.Provider value={value}>{children}</UIContext.Provider>;
}

/**
 * Hook to access UI context
 */
export function useUI(): UIContextValue {
  const context = useContext(UIContext);
  if (!context) {
    throw new Error('useUI must be used within a UIProvider');
  }
  return context;
}

export default UIContext;
