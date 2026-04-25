# Custom Fonts

Drop WOFF2 and WOFF files here for the following families:

- Ngetic Modern Regular → ngetic-modern-regular.woff2 / .woff
- Hesland Regular       → hesland-regular.woff2 / .woff

The @font-face declarations in src/styles/globals.css are already
wired to these filenames. Once files are present, display type will
render correctly. Until then, SVG exports in /public/images/svg/ are
used as fallbacks for hero and display text.
