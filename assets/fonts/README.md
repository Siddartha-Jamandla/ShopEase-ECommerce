# Fonts

The website can use the system font stack below without external dependencies:

```css
font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
```

If a local font file is added later, place the `.woff2` files in this directory and declare them with `@font-face` in `css/style.css`.

# Asset paths

- Logo: `assets/images/logo/shopnest-logo.svg`
- Hero banner: `assets/images/banners/hero-fashion.jpg`
- Categories: `assets/images/categories/`
- Products: `assets/images/products/`
- Avatar: `assets/images/users/default-avatar.svg`
- SVG icon sprite: `assets/icons/icon-sprite.svg`
