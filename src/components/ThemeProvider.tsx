'use client';

import { ThemeProvider as MuiThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { Theme, ThemeProviderProps, ThemeProviderState } from '@/types';

const initialState: ThemeProviderState = {
  theme: 'auto',
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

// Helper function to get the actual theme mode
const getActualTheme = (theme: Theme): 'light' | 'dark' => {
  if (theme === 'auto') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return theme;
};

// Helper function to apply theme to DOM
const applyThemeToDOM = (theme: Theme): void => {
  const root: HTMLElement = window.document.documentElement;
  root.classList.remove('light', 'dark');
  
  const actualTheme: 'light' | 'dark' = getActualTheme(theme);
  root.classList.add(actualTheme);
};

export function ThemeProvider({
  children,
  defaultTheme = 'dark',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps): JSX.Element {
  // Get initial theme from the blocking script or default to dark
  const getInitialTheme = (): Theme => {
    if (typeof window !== 'undefined' && window.__INITIAL_THEME__) {
      const initialTheme: string = window.__INITIAL_THEME__;
      if (initialTheme === 'light' || initialTheme === 'dark') {
        return initialTheme;
      }
    }
    return defaultTheme;
  };

  const [theme, setThemeState] = useState<Theme>(getInitialTheme);
  const [mounted, setMounted] = useState<boolean>(false);

  // Initialize theme from localStorage on mount
  useEffect((): void => {
    try {
      const savedTheme: string | null = localStorage.getItem(storageKey);
      if (savedTheme && ['light', 'dark', 'auto'].includes(savedTheme)) {
        setThemeState(savedTheme as Theme);
        // Only apply theme if it's different from what's already applied
        if (savedTheme !== getInitialTheme()) {
          applyThemeToDOM(savedTheme as Theme);
        }
      }
    } catch (error) {
      console.warn('Failed to load theme from localStorage:', error);
    }
    setMounted(true);
  }, [storageKey]);

  // Custom setTheme function that persists to localStorage
  const setTheme = useCallback((newTheme: Theme): void => {
    try {
      localStorage.setItem(storageKey, newTheme);
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);
      console.log('Theme changed to:', newTheme, 'Saved to localStorage');
    } catch (error) {
      console.warn('Failed to save theme to localStorage:', error);
      setThemeState(newTheme);
      applyThemeToDOM(newTheme);
    }
  }, [storageKey]);

  // Apply theme to DOM when theme changes
  useEffect((): void => {
    if (!mounted) return;
    applyThemeToDOM(theme);
  }, [theme, mounted]);

  // Listen for system theme changes when using 'auto' mode
  useEffect(() => {
    if (!mounted || theme !== 'auto') return;

    const mediaQuery: MediaQueryList = window.matchMedia('(prefers-color-scheme: dark)');
    
    const handleChange = (): void => {
      applyThemeToDOM(theme);
    };

    mediaQuery.addEventListener('change', handleChange);
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, [theme, mounted]);

  const muiTheme = createTheme({
    palette: {
      mode: mounted ? getActualTheme(theme) : 'light',
    },
    typography: {
      fontFamily: [
        'var(--font-geist-sans)',
        '-apple-system',
        'BlinkMacSystemFont',
        '"Segoe UI"',
        'Roboto',
        '"Helvetica Neue"',
        'Arial',
        'sans-serif',
      ].join(','),
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: 8,
          },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 12,
          },
        },
      },
    },
  });

  const value: ThemeProviderState = {
    theme,
    setTheme,
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      <MuiThemeProvider theme={muiTheme}>
        <CssBaseline />
        {children}
      </MuiThemeProvider>
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = (): ThemeProviderState => {
  const context: ThemeProviderState | undefined = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider');

  return context;
};
