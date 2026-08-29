  const defaultTheme = require('tailwindcss/defaultTheme');

  module.exports = {
    darkMode: 'class',
    content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
    theme: {
      extend: {
        colors: {
          // Premium Core palette
          primary: '#09090b',        // zinc-950 (deep background)
          secondary: '#18181b',      // zinc-900 (cards)
          tertiary: '#27272a',       // zinc-800 (borders/inputs)
          accent: '#3b82f6',         // electric blue accent (blue-500)
          accentLight: '#60a5fa',    // blue-400
          accentGlow: 'rgba(59, 130, 246, 0.5)', 
          muted: '#a1a1aa',          // zinc-400
          surface: '#09090b',

          // Form & text
          formBg: '#18181b',         
          focusBorder: '#52525b',    // zinc-600
          focusBorderDark: '#3f3f46',
          placeholder: '#71717a',    // zinc-500
          textPrimary: '#f4f4f5',    // zinc-100
          label: '#e4e4e7',          // zinc-200

          // Neutrals
          'black-100': '#18181b',
          'black-200': '#27272a',
          'white-100': '#f4f4f5',

          // Card Backgrounds
          'card-bg': '#18181b',
          'card-border': '#27272a',
        },
        opacity: {
          'tag': '0.4',
          'tag-hover': '0.7',
        },
        screens: {
          xs: '450px',
          '3xl': '1920px',
        },
        fontFamily: {
          sans: ['Inter', ...defaultTheme.fontFamily.sans],
          mono: ['Fira Code', ...defaultTheme.fontFamily.mono],
        },
        boxShadow: {
          glass: '0 4px 30px rgba(0, 0, 0, 0.1)',
          glassGlow: '0 0 20px rgba(59, 130, 246, 0.2)',
          glassGlowStrong: '0 0 30px rgba(59, 130, 246, 0.4)',
          button: '0 4px 14px rgba(0, 0, 0, 0.1)',
          timeline: '0 16px 32px rgba(0,0,0,0.4)',
        },
        borderRadius: {
          timeline: '1.25rem',
        },
        spacing: {
          timelinePadding: '1.5rem',
        },
        backgroundImage: theme => ({
          'hero-pattern': "url('/src/assets/herobg.png')",
          'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
          'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        }),
        transitionProperty: {
          height: 'height',
          spacing: 'margin, padding',
        },
        keyframes: {
          fadeIn: {
            '0%': { opacity: 0 },
            '100%': { opacity: 1 },
          },
          slideUp: {
            '0%': { transform: 'translateY(20px)' },
            '100%': { transform: 'translateY(0)' },
          },
        },
        animation: {
          fadeIn: 'fadeIn 0.5s ease-out forwards',
          slideUp: 'slideUp 0.4s ease-out forwards',
        },
      },
    },
    corePlugins: {
      preflight: true,
    },
    plugins: [],
  };
