/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // 主题色系
        'primary': '#6366F1', // indigo-500
        'primary-light': '#818CF8', // indigo-400
        'primary-dark': '#4F46E5', // indigo-600
        
        'secondary': '#10B981', // emerald-500
        'secondary-light': '#34D399', // emerald-400
        'secondary-dark': '#059669', // emerald-600
        
        // 功能色
        'success': '#22C55E', // green-500
        'warning': '#F59E0B', // amber-500
        'danger': '#EF4444', // red-500
        'info': '#3B82F6', // blue-500
        
        // 状态色
        'rest': '#3B82F6',
        'exercise': '#EF4444',
        
        // 背景色
        'bg-light': '#F9FAFB', // gray-50
        'bg': '#FFFFFF', // white
        'bg-dark': '#F3F4F6', // gray-100
        
        // 文本色
        'text-primary': '#111827', // gray-900
        'text-secondary': '#4B5563', // gray-600
        'text-tertiary': '#9CA3AF', // gray-400
      },
      boxShadow: {
        'material-1': '0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.08)',
        'material-2': '0 3px 6px rgba(0,0,0,0.08), 0 3px 6px rgba(0,0,0,0.12)',
        'material-3': '0 10px 20px rgba(0,0,0,0.05), 0 6px 6px rgba(0,0,0,0.08)',
        'material-4': '0 14px 28px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.05)',
        'material-5': '0 19px 38px rgba(0,0,0,0.15), 0 15px 12px rgba(0,0,0,0.1)',
        'top': '0 -2px 10px rgba(0, 0, 0, 0.05)',
      },
      animation: {
        'pulse-fast': 'pulse 1s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ripple': 'ripple 0.6s ease-out forwards',
        'slide-in': 'slideIn 0.2s ease-out',
        'slide-out': 'slideOut 0.2s ease-in',
      },
      keyframes: {
        ripple: {
          '0%': { transform: 'scale(0)', opacity: '0.6' },
          '100%': { transform: 'scale(2)', opacity: '0' },
        },
        slideIn: {
          '0%': { transform: 'translateY(100%)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideOut: {
          '0%': { transform: 'translateY(0)', opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
      },
      borderRadius: {
        'xl': '0.75rem',  // 12px
        '2xl': '1rem',    // 16px
        '3xl': '1.5rem',  // 24px
      },
      fontFamily: {
        'roboto': ['Roboto', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} 