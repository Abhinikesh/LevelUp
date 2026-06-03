/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand:       '#6C63FF',
        coral:       '#FF6584',
        green:       '#43E97B',
        yellow:      '#FFD93D',
        bg:          '#0A0A0F',
        card:        '#12121A',
        border:      '#1E1E2E',
        textprimary: '#F0F0FF',
        muted:       '#8B8BAE',
        gold:        '#FFB800',
      },
      fontFamily: {
        sans:  ['Inter', 'sans-serif'],
        display: ['Syne', 'sans-serif'],
      },
      animation: {
        'float':        'float 3s ease-in-out infinite',
        'pulse-slow':   'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'spin-slow':    'spin 8s linear infinite',
        'glow':         'glow 2s ease-in-out infinite alternate',
        'slide-up':     'slideUp 0.5s ease forwards',
        'slide-down':   'slideDown 0.5s ease forwards',
        'shimmer':      'shimmer 2s linear infinite',
        'bounce-slow':  'bounce 2s infinite',
        'twinkle':      'twinkle 1.5s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%':      { transform: 'translateY(-12px)' },
        },
        glow: {
          from: { boxShadow: '0 0 10px #6C63FF44, 0 0 20px #6C63FF22' },
          to:   { boxShadow: '0 0 20px #6C63FF88, 0 0 40px #6C63FF44, 0 0 60px #6C63FF22' },
        },
        slideUp: {
          from: { opacity: 0, transform: 'translateY(20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        slideDown: {
          from: { opacity: 0, transform: 'translateY(-20px)' },
          to:   { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        twinkle: {
          from: { opacity: 0.3, transform: 'scale(0.8)' },
          to:   { opacity: 1,   transform: 'scale(1.2)' },
        },
      },
      backgroundImage: {
        'gradient-radial':    'radial-gradient(var(--tw-gradient-stops))',
        'brand-gradient':     'linear-gradient(135deg, #6C63FF 0%, #FF6584 100%)',
        'gold-gradient':      'linear-gradient(135deg, #FFB800 0%, #FFD93D 100%)',
        'dark-gradient':      'linear-gradient(180deg, #0A0A0F 0%, #12121A 100%)',
        'card-gradient':      'linear-gradient(145deg, #12121A 0%, #1a1a2e 100%)',
        'shimmer-gradient':   'linear-gradient(90deg, transparent 0%, rgba(108,99,255,0.15) 50%, transparent 100%)',
      },
      boxShadow: {
        'brand':    '0 0 20px rgba(108, 99, 255, 0.4)',
        'brand-lg': '0 0 40px rgba(108, 99, 255, 0.6)',
        'coral':    '0 0 20px rgba(255, 101, 132, 0.4)',
        'green':    '0 0 20px rgba(67, 233, 123, 0.4)',
        'gold':     '0 0 20px rgba(255, 184, 0, 0.4)',
        'card':     '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-lg':  '0 8px 40px rgba(0, 0, 0, 0.6)',
        'inner-brand': 'inset 0 0 20px rgba(108, 99, 255, 0.1)',
      },
      borderRadius: {
        'xl2': '1.25rem',
        'xl3': '1.5rem',
        'xl4': '2rem',
      },
      spacing: {
        '18': '4.5rem',
        '22': '5.5rem',
        '30': '7.5rem',
      },
      transitionTimingFunction: {
        'bounce-in':  'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'smooth-out': 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
      },
    },
  },
  plugins: [],
}
