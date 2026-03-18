module.exports = {
  content: [
    './apps/**/*.{html,ts}',
    './libs/**/*.{html,ts}',
  ],
  theme: { extend: {} },
  plugins: [require('@tailwindcss/typography')],
};
