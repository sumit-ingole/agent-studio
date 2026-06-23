# Static Assets

This directory contains public static assets served by the Next.js app.

## Directory Structure

```
public/
├── favicon.ico          # Browser tab icon
├── robots.txt           # SEO robots configuration
├── sitemap.xml          # XML sitemap for SEO
└── images/              # Image assets (logos, screenshots, etc.)
```

## Using Static Assets

In your components, reference files from this directory:

```tsx
import Image from 'next/image';

export default function Logo() {
  return (
    <Image
      src="/logo.png"
      alt="Logo"
      width={200}
      height={200}
    />
  );
}
```

Or in HTML:

```html
<img src="/logo.png" alt="Logo" />
<link rel="icon" href="/favicon.ico" />
```

## SEO Files

- **robots.txt**: Controls search engine crawling
- **sitemap.xml**: Helps search engines index your site

Generate or update these based on your site structure.

## Performance

- Compress images before adding to this directory
- Use Next.js Image component for optimal performance
- Leverage browser caching by setting proper headers
