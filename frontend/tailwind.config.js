/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sage: {
          light: '#628577',
          DEFAULT: '#355346',
          dark: '#263D33',
        },
        softGreen: {
          light: '#34D399',
          DEFAULT: '#059669',
          dark: '#047857',
        },
        beige: '#EDE8E1',
        cream: '#FAFBF9',
        darkGreen: {
          50: '#F0FDF8',
          100: '#DCFCE7',
          200: '#BBF7D0',
          300: '#86EFAC',
          400: '#4ADE80',
          500: '#10B981',
          600: '#059669',
          700: '#0D5643',
          800: '#0A4334',
          DEFAULT: '#0B2E24',
          900: '#08241C',
          950: '#04140F',
        },
        charcoal: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1E293B',
          DEFAULT: '#1E293B',
          900: '#0F172A',
        },
        mint: {
          50: '#F4FAF6',
          100: '#E6F4EC',
          200: '#D1ECE0',
          300: '#A9DFC7',
          border: '#CCE5D8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.02)',
        'card': '0 4px 6px -1px rgba(11, 46, 36, 0.04), 0 2px 4px -2px rgba(11, 46, 36, 0.03)',
        'card-hover': '0 10px 15px -3px rgba(11, 46, 36, 0.08), 0 4px 6px -4px rgba(11, 46, 36, 0.04)',
      },
    },
  },
  plugins: [],
}

