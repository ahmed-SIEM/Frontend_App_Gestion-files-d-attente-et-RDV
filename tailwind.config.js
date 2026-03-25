/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Couleurs principales
        primary: {
          DEFAULT: '#2563eb', // blue-600
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#e5e7eb', // gray-200
          foreground: '#111827', // gray-900
        },
        destructive: {
          DEFAULT: '#dc2626', // red-600
          foreground: '#ffffff',
        },
        accent: {
          DEFAULT: '#f3f4f6', // gray-100
          foreground: '#111827', // gray-900
        },
        foreground: '#111827',
        ring: '#2563eb',
        border: '#e5e7eb',
        input: '#ffffff',
        background: '#ffffff',
        muted: {
          DEFAULT: '#f3f4f6',
          foreground: '#6b7280',
        },
      },
      borderRadius: {
        lg: '0.5rem',
        md: '0.375rem',
        sm: '0.25rem',
      },
    },
  },
  plugins: [],
}