  const defaultTheme = require('tailwindcss/defaultTheme');

  module.exports = {
    darkMode: 'class',
    content: ['./src/**/*.{js,jsx,ts,tsx,html}'],
    theme: {
      extend: {
        colors: {
          // Core palette
          primary: '#001920',
          secondary: '#38B2AC',      // Teal from Tailwind's palette (vibrant + modern)
    tertiary: '#1F2937',       // Cool neutral for panels
    accent: '#EF4444',         // Tailwind’s red-500 for consistency & visibility
    muted: '#9CA3AF',          // Gray-400, better readability

    surface: '#0F2027', 

          // Form & text
          formBg: '#112D32',         // Dark cyan-black for input background
          focusBorder: '#22D3EE',    // Tailwind’s cyan-400 (bright focus)
          focusBorderDark: '#0E7490',// Tailwind’s cyan-700 (dark mode variant)
          placeholder: '#94A3B8',    // Softer muted blue-gray
          textPrimary: '#F9FAFB',    // Tailwind’s lightest text
          label: '#A5F3FC',          // Accent for labels, cyan-200

          // Neutrals
            
        'black-100': '#1E293B',    // Slate-800
        'black-200': '#334155',    // Slate-700
        'white-100': '#F8FAFC',    // Lightest neutral

          // Gradient palette
          'gradient-blue-start': '#3B82F6',  // Blue-500
    'gradient-blue-via': '#06B6D4',    // Cyan-500
    'gradient-blue-end': '#67E8F9',    // Cyan-300

    'gradient-pink-start': '#EC4899',  // Pink-500
    'gradient-pink-via': '#F472B6',    // Pink-400
    'gradient-pink-end': '#F9A8D4',    // Pink-300

    'gradient-gold-start': '#FBBF24',  // Amber-400
    'gradient-gold-via': '#FB923C',    // Orange-400
    'gradient-gold-end': '#F87171',    // Red-400

          // Certification section
    'cert-bg': '#1E293B',              // Slightly lighter dark bg
    'cert-card-bg': '#111827',         // Slate-900
    'cert-title': '#E0E7FF',           // Soft white-blue
    'cert-subtitle': '#94A3B8',        // Blue-gray muted
    'cert-text': '#CBD5E1',            // Better readability
    'cert-accent': '#8B5CF6',          // Violet-500

    // Timeline & Experience
    'timeline-border': 'rgba(34, 211, 238, 0.5)', // Cyan border
    'timeline-bg': 'rgba(15, 23, 42, 0.85)',      // Dark slate overlay
    'timeline-text': '#F1F5F9',                  // Light slate
    'timeline-icon-bg': '#0F172A',               // Slate-900
    'timeline-icon-gradient-from': '#06b6d4',
    'timeline-icon-gradient-to': '#3b82f6',
    'timeline-tag': '#2563EB',                   // Blue-600
    'timeline-hover-text': '#FFFFFF',

    // Experience titles
    'exp-title-grad-from': '#3B82F6',  // Blue-500
    'exp-title-grad-to': '#06B6D4',    // Cyan-500
    'exp-grad-from': '#0EA5E9',        // Sky-500
    'exp-grad-to': '#3B82F6',          // Blue-500
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
          card: '0 35px 120px -15px rgba(33, 30, 53, 0.7)',
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
