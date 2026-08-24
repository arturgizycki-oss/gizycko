"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import type { PhotoCredit } from "@/lib/photo-credits";

const INTERVAL_MS = 15_000;

/**
 * Cross-fades through several photographs of Giżycko behind the app.
 *
 * Only photographs that have actually been shown are mounted. Rendering all of
 * them up front would download every full-screen image on first paint, which is
 * megabytes of traffic for pictures nobody sees for the first minute.
 *
 * Someone who has asked their system for reduced motion gets a single still —
 * an unprompted background change is exactly the movement that setting means to
 * stop, and it also means they download one image rather than several.
 */
export function RotatingBackdrop({
  photos,
  overlay = "heavy",
}: {
  photos: PhotoCredit[];
  overlay?: "light" | "medium" | "heavy";
}) {
  const [index, setIndex] = useState(0);
  const [mounted, setMounted] = useState<number[]>([0]);
  const indexRef = useRef(0);

  useEffect(() => {
    if (photos.length < 2) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const id = setInterval(() => {
      const next = (indexRef.current + 1) % photos.length;
      indexRef.current = next;

      setIndex(next);
      setMounted((current) =>
        current.includes(next) ? current : [...current, next],
      );
    }, INTERVAL_MS);

    return () => clearInterval(id);
  }, [photos.length]);

  const scrim = {
    light: "bg-white/55 dark:bg-neutral-950/65",
    medium: "bg-white/75 dark:bg-neutral-950/80",
    heavy: "bg-white/88 dark:bg-neutral-950/90",
  }[overlay];

  const current = photos[index];

  return (
    <div className="pointer-events-none fixed inset-0 -z-10">
      {mounted.map((at) => (
        <Image
          key={photos[at].src}
          src={photos[at].src}
          alt={at === index ? photos[at].alt : ""}
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
