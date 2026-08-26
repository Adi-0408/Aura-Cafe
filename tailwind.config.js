/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Ocean Fog (Canvas, Mist surfaces & airy backgrounds)
        cream: {
          50: '#FAFCFC',
          100: '#F2F6F7',
          200: '#E5ECEE',
          300: '#D2DFE2',
          400: '#B4C5C9',
          DEFAULT: '#F6F9FA',
        },
        // Pacific Drip (Deep oceanic slate, cool third-wave charcoal)
        espresso: {
          50: '#F0F6FA',
          100: '#E0ECF4',
          200: '#B5CDE0',
          300: '#86ABC0',
          400: '#5A889F',
          500: '#2B4E5E',
          600: '#1E3A47',
          700: '#152A35',
          800: '#0E1D24',
          900: '#081318',
          DEFAULT: '#10222B',
        },
        // Sea Glass & Pacific Teal Wave (Accent)
        caramel: {
          50: '#EBF7F7',
          100: '#D1EEEE',
          200: '#A3DEDE',
          300: '#77C7C6',
          400: '#3BAFA9',
          500: '#1B8585',
          600: '#146868',
          700: '#0E4D4D',
          DEFAULT: '#1B8585',
        },
        // Coastal Pine & Seafoam
        sage: {
          50: '#F1F7F6',
          100: '#DDECE9',
          200: '#BEDCD6',
          300: '#9AC9C0',
          400: '#6FAFA3',
          500: '#4B8E83',
          600: '#386D65',
          700: '#264D47',
          DEFAULT: '#4B8E83',
        },
        // Coastal Dune Terracotta / Driftwood
        terracotta: {
          50: '#FAF5F2',
          100: '#F3E7E0',
          200: '#E5CABE',
          300: '#D3A796',
          400: '#BE816C',
          500: '#A3604C',
          600: '#834735',
          700: '#633123',
          DEFAULT: '#A3604C',
        },
        // Coastal Sunrise Amber (Warm highlight against cool fog)
        honey: {
          50: '#FEFAF0',
          100: '#FDF3D9',
          200: '#FBE4A8',
          300: '#F7D072',
          400: '#F0BC40',
          500: '#E29D52',
          600: '#C77D34',
          DEFAULT: '#E29D52',
        }
      },
      fontFamily: {
        serif: ['"Playfair Display"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'warm-sm': '0 1px 3px rgba(16, 34, 43, 0.05), 0 1px 2px rgba(16, 34, 43, 0.03)',
        'warm-md': '0 4px 12px rgba(16, 34, 43, 0.08), 0 2px 4px rgba(16, 34, 43, 0.04)',
        'warm-lg': '0 10px 25px rgba(16, 34, 43, 0.1), 0 4px 10px rgba(16, 34, 43, 0.06)',
        'warm-xl': '0 20px 35px rgba(16, 34, 43, 0.14), 0 8px 16px rgba(16, 34, 43, 0.08)',
        'warm-2xl': '0 25px 50px -12px rgba(16, 34, 43, 0.25)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'slide-up': 'slideUp 0.6s ease-out forwards',
        'pulse-subtle': 'pulseSubtle 3s infinite ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        pulseSubtle: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        }
      }
    },
  },
  plugins: [],
}
