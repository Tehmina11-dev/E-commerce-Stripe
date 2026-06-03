"use client";

import { useState } from "react";
import { ImageOff } from "lucide-react";

/**
 * Plain <img> with graceful fallback. We avoid next/image here because product
 * image URLs are arbitrary (set by the backend) and shouldn't require host
 * allow-listing in next.config.
 */
export function ProductImage({
  src,
  alt,
  className = "",
}: {
  src: string | null;
  alt: string;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-gradient-to-br from-zinc-100 to-zinc-200 text-zinc-400 ${className}`}
      >
        <ImageOff size={32} strokeWidth={1.5} />
      </div>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
