"use client";

import { useState } from "react";
import { mediaUrl } from "@/lib/format";

interface Props {
  /** Library-relative path: "images/…jpg" for a still, "videos/…gif" for the animation. */
  path: string;
  alt: string;
  className?: string;
  eager?: boolean;
}

/**
 * Exercise picture. Sizing, background and borders come from the wrapper's CSS;
 * if the file can't be loaded it shows a quiet placeholder instead of a broken icon.
 */
export function ExerciseMedia({ path, alt, className, eager = false }: Props) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div role="img" aria-label={alt} className="media-missing">
        No preview
      </div>
    );
  }

  return (
    // Plain <img>: the animated GIFs are tiny (180×180) and next/image would not animate them anyway.
    <img
      src={mediaUrl(path)}
      alt={alt}
      loading={eager ? "eager" : "lazy"}
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
