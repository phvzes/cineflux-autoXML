/**
 * theme.ts
 * 
 * This file defines the application's color palette and theme settings.
 */

export const colorPalette = {
  // Background colors
  richBlack: '#121218',       // Primary background
  charcoal: '#1E1E24',        // Secondary background
  darkGrey: '#2A2A30',        // UI elements
  
  // Text colors
  offWhite: '#F5F5F7',        // Primary text
  lightGrey: '#B0B0B5',       // Secondary text
  
  // Accent colors
  subtleOrange: '#FF7A45',    // Interactive elements
  subtleGreen: '#4CAF50',     // Success
  mutedRed: '#E53935',        // Warning/Error
};

export const theme = {
  colors: {
    ...colorPalette,
    background: {
      primary: colorPalette.richBlack,
      secondary: colorPalette.charcoal,
      ui: colorPalette.darkGrey,
    },
    text: {
      primary: colorPalette.offWhite,
      secondary: colorPalette.lightGrey,
    },
    accent: {
      primary: colorPalette.subtleOrange,
      success: colorPalette.subtleGreen,
      error: colorPalette.mutedRed,
    }
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
    full: '9999px',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    fontSizes: {
      xs: '0.75rem',
      sm: '0.875rem',
      md: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeights: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  shadows: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
  },
  transitions: {
    fast: '150ms ease',
    normal: '250ms ease',
    slow: '350ms ease',
  },
};

export default theme;
