/** @type {import('tailwindcss').Config} */
module.exports = {
  safelist: [
    {
      pattern: /^(from|to|bg|text|border)-(emerald|amber|blue|orange|purple)-(50|100|200|300|400|500|600|700|800|900)$/,
    },
  ],
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Helvetica Neue', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Seeds of Empowerment brand colors
        'soe-green': {
          50: '#f0f9e8',
          100: '#dcf0c6',
          200: '#c4e390',
          300: '#a7d453',
          400: '#9fcc40',  // Primary SOE green
          500: '#8db832',
          600: '#7ba426',
          700: '#68901e',
          800: '#557c18',
          900: '#456813',
        },
        'soe-yellow': {
          50: '#fefdf8',
          100: '#fef9e8',
          200: '#fdf2c6',
          300: '#fceb9f',
          400: '#fec96b',  // Primary SOE yellow/gold
          500: '#fdb642',
          600: '#fca326',
          700: '#f9900f',
          800: '#e07c04',
          900: '#c86503',
        },
        'soe-purple': {
          50: '#f8f4ff',
          100: '#ede4ff',
          200: '#ddc8ff',
          300: '#c5a0ff',
          400: '#a871ff',
          500: '#874FFF',  // Primary SOE purple
          600: '#7339f0',
          700: '#6128d1',
          800: '#5020a8',
          900: '#421c87',
        },
        // Design System Semantic Colors (connected to CSS custom properties)
        primary: {
          50: '#f0f9e8',
          100: '#dcf0c6',    // --color-primary-light
          200: '#c4e390',
          300: '#a7d453',
          400: '#9fcc40',    // --color-primary
          500: '#8db832',
          600: '#7ba426',
          700: '#68901e',    // --color-primary-dark
          800: '#557c18',
          900: '#456813',
        },
        secondary: {
          400: '#fec96b',    // --color-secondary
          800: '#e07c04',    // --color-secondary-dark
        },
        // Content colors mapped to CSS custom properties
        content: {
          primary: 'rgb(17, 24, 39)',      // --color-text-primary
          secondary: 'rgb(55, 65, 81)',    // --color-text-secondary
          tertiary: 'rgb(75, 85, 99)',     // --color-text-tertiary
          inverse: 'rgb(255, 255, 255)',   // --color-text-inverse
        },
        // Surface/background colors
        surface: {
          primary: 'rgb(255, 255, 255)',   // --color-bg-primary
          secondary: 'rgb(249, 250, 251)', // --color-bg-secondary
          tertiary: 'rgb(243, 244, 246)',  // --color-bg-tertiary
        },
        // Status colors (maintain existing functionality)
        status: {
          success: 'rgb(34, 197, 94)',     // --color-success
          'success-dark': 'rgb(22, 101, 52)', // --color-success-dark
          warning: 'rgb(245, 158, 11)',    // --color-warning
          'warning-dark': 'rgb(146, 64, 14)', // --color-warning-dark
          error: 'rgb(239, 68, 68)',       // --color-error
          'error-dark': 'rgb(153, 27, 27)', // --color-error-dark
        },
        // Figma Design System Colors
        figma: {
          black: '#141414',
          'gray-inactive': '#6B7280', // WCAG AA compliant (4.5:1 contrast ratio)
          'gray-border': '#E5E5EA',
          'gray-border-alt': '#E4E4E4',
          'gray-bg': '#73757C',
          active: '#33363F',
        }
      },
      // Unified gradient system connected to CSS custom properties
      backgroundImage: {
        'gradient-primary': 'var(--gradient-primary)',
        'gradient-primary-soft': 'var(--gradient-primary-soft)',
        'gradient-hero': 'var(--gradient-hero)',
        'gradient-hero-alt': 'var(--gradient-hero-alt)',
        'gradient-cta': 'var(--gradient-cta)',
        'gradient-cta-hover': 'var(--gradient-cta-hover)',
        'gradient-cultural': 'var(--gradient-cultural)',
        'gradient-cultural-soft': 'var(--gradient-cultural-soft)',
        'gradient-educational': 'var(--gradient-educational)',
        'gradient-learning': 'var(--gradient-learning)',
        'gradient-success': 'var(--gradient-success)',
        'gradient-warning': 'var(--gradient-warning)',
        'gradient-error': 'var(--gradient-error)',
      },
      // Box shadow system connected to CSS custom properties
      boxShadow: {
        'design-sm': 'var(--shadow-sm)',
        'design-md': 'var(--shadow-md)',
        'design-lg': 'var(--shadow-lg)',
        'design-xl': 'var(--shadow-xl)',
        'focus': 'var(--shadow-focus)',
      },
      // Border radius system connected to CSS custom properties
      borderRadius: {
        'design-sm': 'var(--radius-sm)',
        'design-md': 'var(--radius-md)',
        'design-lg': 'var(--radius-lg)',
        'design-xl': 'var(--radius-xl)',
        'design-2xl': 'var(--radius-2xl)',
        'design-full': 'var(--radius-full)',
      },
      // Typography scale connected to CSS custom properties
      fontSize: {
        'design-xs': ['var(--font-size-xs)', { lineHeight: 'var(--line-height-tight)' }],
        'design-sm': ['var(--font-size-sm)', { lineHeight: 'var(--line-height-normal)' }],
        'design-base': ['var(--font-size-base)', { lineHeight: 'var(--line-height-normal)' }],
        'design-lg': ['var(--font-size-lg)', { lineHeight: 'var(--line-height-normal)' }],
        'design-xl': ['var(--font-size-xl)', { lineHeight: 'var(--line-height-relaxed)' }],
        'design-2xl': ['var(--font-size-2xl)', { lineHeight: 'var(--line-height-tight)' }],
        'design-3xl': ['var(--font-size-3xl)', { lineHeight: 'var(--line-height-tight)' }],
        'design-4xl': ['var(--font-size-4xl)', { lineHeight: 'var(--line-height-tight)' }],
        // Figma Typography System
        'figma-title-03': ['24px', { lineHeight: '1.221', fontWeight: '500' }],
        'figma-body-03': ['18px', { lineHeight: '1.193', fontWeight: '400' }],
        'figma-body-04': ['16px', { lineHeight: '1.193', fontWeight: '400' }],
      },
      // Spacing system connected to CSS custom properties
      spacing: {
        'design-0-5': 'var(--space-0-5)',
        'design-1': 'var(--space-1)',
        'design-1-5': 'var(--space-1-5)',
        'design-2': 'var(--space-2)',
        'design-3': 'var(--space-3)',
        'design-4': 'var(--space-4)',
        'design-5': 'var(--space-5)',
        'design-6': 'var(--space-6)',
        'design-8': 'var(--space-8)',
        'design-10': 'var(--space-10)',
        'design-12': 'var(--space-12)',
        // LNB width
        'lnb': '240px',
      },
      // Animation system for accessibility
      transitionDuration: {
        'design': 'var(--transition-duration)',
      },
      // Minimum touch target for accessibility
      minHeight: {
        'touch': 'var(--min-touch-target)',
      },
      minWidth: {
        'touch': 'var(--min-touch-target)',
      },
    },
  },
  plugins: [],
}