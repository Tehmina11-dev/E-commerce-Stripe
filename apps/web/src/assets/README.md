# Assets

Local images, icons, and other static files that are **imported into components**.

## How to use an image

Put the file under `src/assets/images/` and import it — `next/image` reads the
dimensions automatically and optimizes it (lazy-load, responsive sizes, etc.):

```tsx
import Image from "next/image";
import banner from "@/assets/images/banner.jpg";

<Image src={banner} alt="Spring sale" placeholder="blur" />;
```

- **`@/assets/...`** maps to `src/assets/...` (see `tsconfig.json` paths).
- Raster files (`.jpg`, `.png`, `.webp`) are optimized automatically.
- For `.svg`, pass `unoptimized` (see `Hero.tsx`) — Next won't run SVGs through
  the image optimizer by default.

## `src/assets` vs `public/`

| Use `src/assets/` (imported)        | Use `public/` (served by URL)             |
| ----------------------------------- | ----------------------------------------- |
| Optimized + hashed by the bundler   | Referenced by static path, e.g. `/logo.png` |
| Type-checked import, build error if missing | favicon, robots.txt, OG images, raw downloads |

To swap the hero art: drop your file in `src/assets/images/` and update the
import in [`src/components/layout/Hero.tsx`](../components/layout/Hero.tsx).
