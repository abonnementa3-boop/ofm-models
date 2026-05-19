/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: { body: '#0a0a0c', card: '#15151a', border: '#27272e', hover: '#1d1d24' },
        text: { primary: '#fafafa', secondary: '#a3a3ad', muted: '#6b6b75' },
        accent: {
          purple: '#8B5CF6', 'purple-light': '#A78BFA',
          pink: '#EC4899', green: '#10B981',
          orange: '#F59E0B', red: '#EF4444', blue: '#3B82F6',
        },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
