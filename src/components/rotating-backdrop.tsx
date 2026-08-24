"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import type { PhotoCredit } from "@/lib/photo-credits";

const INTERVAL_MS = 15_000;

/**
 * Cross-fades through several photographs of Giżycko behind the app. Every
 * image is rendered once and only its opacity changes, so switching costs
 * nothing after the first load.
 *
 * Someone who has asked their system for reduced motion gets a single still
 * image — an unprompted background change is exactly the kind of movement that
 * setting is meant to stop.
 */
export function RotatingBackdrop({
  photos,
  overlay = "heavy",
}: {
  photos: PhotoCredit[];
  overlay?: "light" | "medium" | "heavy";
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (photos.length < 2) return;

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches) return;

    const id = setInterval(
      () => setIndex((current) => (current + 1) % photos.length),
      INTERVAL_MS,
    );
    return () => clearInterval(id);
  }, [photos.length]);

  const scrim = {
    light: "bg-white/55 dark:bg-neutral-950/65",
    medium: "bg-white/75 dark:bg-neutral-950/80",
    heavy: "bg-white/88 dark:bg-neutral-950/90",
  }[overlay];

  const current = photos[index] ?? photos[0];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {photos.map((photo, at) => (
        <Image
          key={photo.src}
          src={photo.src}
          alt={at === index ? photo.alt : ""}
          fill
          priority={at === 0}
          sizes="100vw"
          className="object-cover transition-opacity duration-[2000ms] ease-in-out"
          style={{ opacity: at === index ? 1 : 0 }}
        />
      ))}

      <div className={`absolute inset-0 ${scrim}`} />

      {current && (
        <p className="pointer-events-auto absolute right-2 bottom-1 text-[10px] text-neutral-500/80">
          Giżycko ·{" "}
          <a
            href={current.source}
            target="_blank"
            rel="noreferrer noopener"
            className="underline"
          >
            {current.author}
          </a>{" "}
          /{" "}
          <a
            href={current.licenceUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="underline"
          >
            {current.licence}
          </a>
        </p>
      )}
    </div>
  );
}
