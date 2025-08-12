/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        poppins: ['Poppins', 'sans-serif'],
      },
      animation: {
        'blob': 'blob 7s infinite',
        'gradient-shift': 'gradient-shift 4s ease infinite',
        'gradient-animation': 'gradient-animation 15s ease infinite',
        'floating': 'floating 6s ease-in-out infinite',
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slide-up 0.5s ease-out',
        'fade-in': 'fade-in 0.5s ease-out',
        'scale-in': 'scale-in 0.5s ease-out',
      },
      keyframes: {
        blob: {
          '0%, 100%': { transform: 'translate(0px, 0px) scale(1)' },
          '33%': { transform: 'translate(30px, -50px) scale(1.1)' },
          '66%': { transform: 'translate(-20px, 20px) scale(0.9)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        'gradient-animation': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        floating: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '33%': { transform: 'translateY(-10px) rotate(1deg)' },
          '66%': { transform: 'translateY(5px) rotate(-1deg)' },
        },
        'slide-up': {
          from: { 
            opacity: '0',
            transform: 'translateY(30px)',
          },
          to: { 
            opacity: '1',
            transform: 'translateY(0)',
          },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { 
            opacity: '0',
            transform: 'scale(0.9)',
          },
          to: { 
            opacity: '1',
            transform: 'scale(1)',
          },
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
  // Safelist gradient classes to ensure they're included in production
  safelist: [
    // Gradient from colors
    'from-blue-500',
    'from-cyan-500',
    'from-emerald-500',
    'from-teal-500',
    'from-purple-500',
    'from-pink-500',
    'from-rose-500',
    'from-orange-500',
    'from-indigo-500',
    'from-indigo-50',
    'from-indigo-400',
    'from-indigo-500/20',
    'from-indigo-950/30',
    // Gradient to colors
    'to-cyan-500',
    'to-teal-500',
    'to-pink-500',
    'to-orange-500',
    'to-purple-500',
    'to-rose-500',
    'to-purple-400',
    'to-purple-500',
    'to-purple-500/20',
    'to-pink-50',
    'to-pink-950/30',
    // Gradient via colors
    'via-purple-500',
    'via-purple-50',
    'via-purple-950/30',
    'via-gray-50/50',
    'via-gray-900/50',
    // Background gradients
    'bg-gradient-to-r',
    'bg-gradient-to-br',
    'bg-gradient-to-b',
    'bg-gradient-to-l',
    'bg-gradient-to-tr',
    // Text gradient
    'bg-clip-text',
    'text-transparent',
    // Shadow colors
    'shadow-blue-500/25',
    'shadow-emerald-500/25',
    'shadow-purple-500/25',
    'shadow-rose-500/25',
    'shadow-indigo-500/25',
    'shadow-pink-500/25',
    // Background colors
    'bg-pink-300',
    'bg-pink-600',
    'bg-purple-300',
    'bg-purple-600',
    'bg-indigo-300',
    'bg-indigo-600',
    'bg-indigo-50',
    'bg-indigo-900/30',
    'bg-purple-50',
    'bg-purple-900/30',
    'bg-green-50',
    'bg-green-900/30',
    // Dark mode backgrounds
    'dark:bg-pink-600',
    'dark:bg-purple-600',
    'dark:bg-indigo-600',
    'dark:from-indigo-950/30',
    'dark:via-purple-950/30',
    'dark:to-pink-950/30',
    'dark:from-gray-900',
    'dark:via-gray-900/50',
    'dark:to-gray-900',
    // Text colors
    'text-indigo-700',
    'text-purple-700',
    'text-green-700',
    'dark:text-indigo-300',
    'dark:text-purple-300',
    'dark:text-green-300',
    // Border colors
    'border-indigo-200',
    'border-indigo-800',
    'dark:border-indigo-800',
    // Opacity
    'opacity-5',
    'opacity-10',
    // Animation delays
    'animate-delay-100',
    'animate-delay-200',
    'animate-delay-300',
    'animate-delay-400',
    'animate-delay-500',
  ],
}