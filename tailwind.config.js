/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CineFlux color palette
        'rich-black': '#121218',
        'charcoal': '#1E1E24',
        'dark-grey': '#2A2A30',
        'off-white': '#F5F5F7',
        'light-grey': '#B0B0B5',
        'subtle-orange': '#FF7A45',
        'subtle-orange-hover': '#FF6A35',
        'subtle-orange-active': '#FF5A25',
        'subtle-green': '#4CAF50',
        'subtle-green-hover': '#43A047',
        'subtle-green-active': '#388E3C',
        'muted-red': '#E53935',
        'muted-red-hover': '#D32F2F',
        'muted-red-active': '#C62828',
        
        // Semantic colors
        'bg-primary': '#121218',
        'bg-secondary': '#1E1E24',
        'ui-element': '#2A2A30',
        'text-primary': '#F5F5F7',
        'text-secondary': '#B0B0B5',
        'accent': '#FF7A45',
        'success': '#4CAF50',
        'warning': '#E53935',
      },
      spacing: {
        'xs': '4px',
        'sm': '8px',
        'md': '16px',
        'lg': '24px',
        'xl': '32px',
        '2xl': '48px',
      },
      borderRadius: {
        'sm': '4px',
        'md': '8px',
        'lg': '12px',
      },
      fontFamily: {
        'sans': ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      fontSize: {
        'xs': '0.75rem',
        'sm': '0.875rem',
        'md': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
      },
      fontWeight: {
        'normal': 400,
        'medium': 500,
        'semibold': 600,
        'bold': 700,
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.05)',
        'md': '0 4px 6px rgba(0, 0, 0, 0.1)',
        'lg': '0 10px 15px rgba(0, 0, 0, 0.1)',
        'xl': '0 20px 25px rgba(0, 0, 0, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionProperty: {
        'height': 'height',
        'spacing': 'margin, padding',
      },
      transitionDuration: {
        'fast': '150ms',
        'normal': '250ms',
        'slow': '350ms',
      },
      transitionTimingFunction: {
        'default': 'ease',
        'in-out': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'in': 'cubic-bezier(0.4, 0, 1, 1)',
        'out': 'cubic-bezier(0, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
}
