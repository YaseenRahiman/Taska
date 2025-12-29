/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#16A085', // Turquoise
          50: '#E8F6F3',
          100: '#D1EDE7',
          200: '#A3DBCF',
          300: '#75C9B7',
          400: '#47B79F',
          500: '#16A085', // Main brand color
          600: '#12806B',
          700: '#0E6051',
          800: '#0A4037',
          900: '#06201D',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: '#E74C3C', // Coral
          50: '#FCE4E1',
          100: '#F9C9C3',
          200: '#F39287',
          300: '#ED5C4B',
          400: '#E74C3C', // Main secondary color
          500: '#C0392B',
          600: '#992D22',
          700: '#732119',
          800: '#4C1610',
          900: '#260B08',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        accent: {
          DEFAULT: '#F1C40F', // Sunshine Yellow (CTA)
          50: '#FEFBF2',
          100: '#FDF7E5',
          200: '#FAEFCB',
          300: '#F7E7B1',
          400: '#F4DF97',
          500: '#F1C40F', // Main accent color
          600: '#C19D0C',
          700: '#917609',
          800: '#614F06',
          900: '#302703',
          foreground: 'hsl(var(--accent-foreground))',
        },
        cream: {
          DEFAULT: '#FDF5E6', // Soft Cream (Background)
          50: '#FEFCF9',
          100: '#FDF5E6', // Main cream color
          200: '#FBEBCD',
          300: '#F9E1B4',
          400: '#F7D79B',
          500: '#F5CD82',
          600: '#C4A468',
          700: '#937B4E',
          800: '#625234',
          900: '#31291A',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui'],
        display: ['Inter', 'ui-sans-serif', 'system-ui'],
        african: ['Ubuntu', 'Roboto', 'sans-serif'], // Local African fonts fallback
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-in-right': {
          '0%': { transform: 'translateX(100%)' },
          '100%': { transform: 'translateX(0)' },
        },
        'bounce-in': {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.1)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        shimmer: {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'fade-in': 'fade-in 0.2s ease-out',
        'slide-in-right': 'slide-in-right 0.3s ease-out',
        'bounce-in': 'bounce-in 0.6s ease-out',
        shimmer: 'shimmer 2s infinite',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};
