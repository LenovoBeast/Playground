// Tailwind v4 runs through its dedicated PostCSS plugin. Vendor prefixing is
// built in, so autoprefixer is no longer needed.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
}
