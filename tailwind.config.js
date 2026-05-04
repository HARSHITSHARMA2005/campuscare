/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ['Playfair Display', 'serif'],
        dm: ['DM Sans', 'sans-serif'],
      },
      colors: {
        bloom: '#d4547a',
        petal: '#f9d0d0',
        blush: '#fde8e8',
        rose: '#e8a0a0',
        cream: '#fdf8f4',
      },
      animation: {
        'sway': 'sway 3s ease-in-out infinite',
        'float': 'float 6s ease-in-out infinite',
        'pulse-rose': 'pulse-rose 2s ease-in-out infinite',
        'cloud-drift': 'cloud-drift 60s linear infinite',
        'fade-up': 'fade-up 0.8s ease both',
      },
      keyframes: {
        sway: {
          '0%, 100%': { transform: 'rotate(-8deg)' },
          '50%': { transform: 'rotate(8deg)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-12px)' },
        },
        'pulse-rose': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(1.7)' },
        },
        'cloud-drift': {
          '0%': { transform: 'translateX(-200px)' },
          '100%': { transform: 'translateX(calc(100vw + 200px))' },
        },
        'fade-up': {
          'from': { opacity: '0', transform: 'translateY(32px)' },
          'to': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
}