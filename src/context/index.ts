/**
 * Context Index
 * Central export for all context providers
 */

// User Context
export {
  UserProvider,
  useUser,
  type UserContextValue,
  type User,
  type UserProviderProps,
} from './UserContext';

// Theme Context
export {
  ThemeProvider,
  useTheme,
  type ThemeContextValue,
  type Theme,
  type ThemeProviderProps,
} from './ThemeContext';

// Re-export legacy contexts for backward compatibility
// These will be migrated to TypeScript in subsequent phases
