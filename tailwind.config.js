module.exports = {
  content: [
    './apps/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  darkMode: ['selector', '[data-theme="dark"]'],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
};
