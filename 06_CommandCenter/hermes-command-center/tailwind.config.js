import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
    './public/**/*.html',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Space Grotesk', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        command: {
          bg: '#FFFFFF',
          surface: '#F8F8FA',
          elevated: '#FFFFFF',
          border: '#E5E7EC',
          text: '#111111',
          muted: '#777B85',
          graphite: '#383A40',
        },
        accent: {
          violet: '#7C3AED',
          magenta: '#C026D3',
          blue: '#2563EB',
          cyan: '#06B6D4',
        }
      },
      backgroundImage: {
        'hero-gradient': 'linear-gradient(135deg, #7C3AED 0%, #2563EB 50%, #06B6D4 100%)',
        'status-gradient': 'linear-gradient(135deg, #7C3AED 0%, #2563EB 100%)',
        'blocked-gradient': 'linear-gradient(135deg, #C026D3 0%, #DC2626 100%)',
        'success-gradient': 'linear-gradient(135deg, #059669 0%, #06B6D4 100%)',
        'warning-gradient': 'linear-gradient(135deg, #D97706 0%, #DC2626 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'gradient-shift': 'gradient-shift 3s ease infinite',
      },
      keyframes: {
        'gradient-shift': {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
