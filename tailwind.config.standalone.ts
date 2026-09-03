import type { Config } from 'tailwindcss';

export default {
  content: [
    './client/src/**/*.{ts,tsx,css}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#ff6c37',
      },
    },
  },
  plugins: [],
} satisfies Config;
