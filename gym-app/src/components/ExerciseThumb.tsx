"use client";

import Link from "next/link";
import { useState } from "react";
import { gifPathFor, mediaUrl } from "@/lib/format";

/**
 * Library tile picture: a still image that plays the exercise animation
 * while the pointer (or keyboard focus) is on it.
 */
export function ExerciseThumb({ href, image, label }: { href: string; image: string; label: string }) {
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  return (
    <Link
      href={href}
      className="tile-link"
      aria-label={`${label}: steps and timing`}
      onMouseEnter={() => setPlaying(true)}
      onMouseLeave={() => setPlaying(false)}
      onFocus={() => setPlaying(true)}
      onBlur={() => setPlaying(false)}
    >
      {failed ? (
        <span className="media-missing">No preview</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mediaUrl(playing ? gifPathFor(image) : image)}
          alt=""
          loading="lazy"
          decoding="async"
          onError={() => setFailed(true)}
        />
      )}
    </Link>
  );
}
