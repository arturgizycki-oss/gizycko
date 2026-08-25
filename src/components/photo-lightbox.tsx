"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { PhotoPlaceholder } from "./avatar";
import { useT } from "@/lib/i18n/provider";
import { ChevronLeftIcon, ChevronRightIcon } from "./icons";

/**
 * Full-size viewer. Profile photos are cropped to fit their frames, so this is
 * the only place the whole picture is visible - it scales to fit the window
 * rather than filling it, and never crops.
 */
export function Lightbox({
  photos,
  index,
  onClose,
  onIndex,
}: {
  photos: string[];
  index: number;
  onClose: () => void;
  onIndex: (next: number) => void;
}) {
  const t = useT();
  const step = useCallback(
    (by: number) => onIndex((index + by + photos.length) % photos.length),
    [index, photos.length, onIndex],
  );

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") step(1);
      if (event.key === "ArrowLeft") step(-1);
    }

    document.addEventListener("keydown", onKey);
    // Stop the page behind scrolling while the viewer is open.
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, [onClose, step]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("photos.viewer")}
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label={t("action.close")}
        className="absolute top-4 right-4 rounded-full bg-white/15 px-3 py-1.5 text-sm font-medium text-white hover:bg-white/25"
      >
        {t("action.close")}
      </button>

      {photos.length > 1 && (
        <>
          <button
            type="button"
            aria-label={t("photos.previous")}
            onClick={(event) => {
              event.stopPropagation();
              step(-1);
            }}
            className="absolute left-3 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
          >
            <ChevronLeftIcon className="size-6" />
          </button>
          <button
            type="button"
            aria-label={t("photos.next")}
            onClick={(event) => {
              event.stopPropagation();
              step(1);
            }}
            className="absolute right-3 rounded-full bg-white/15 px-3 py-2 text-white hover:bg-white/25"
          >
            <ChevronRightIcon className="size-6" />
          </button>
          <span className="absolute bottom-5 text-xs text-white/70">
            {index + 1} / {photos.length}
          </span>
        </>
      )}

      {/* object-contain is the whole point: show all of it, cropped nowhere. */}
      <Image
        src={photos[index]}
        alt=""
        width={1600}
        height={1600}
        sizes="100vw"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[88vh] w-auto max-w-full rounded-lg object-contain"
      />
    </div>
  );
}

/** The banner at the top of a profile. Click it to see the whole photo. */
export function CoverPhoto({
  photos,
  name,
  subtitle,
}: {
  photos: string[];
  name: string;
  subtitle: string;
}) {
  const [open, setOpen] = useState<number | null>(null);

  const cover = photos[0];

  return (
    <>
      <div className="relative h-44 w-full sm:h-56">
        {cover ? (
          <button
            type="button"
            onClick={() => setOpen(0)}
            aria-label={`See ${name}'s photo full size`}
            className="absolute inset-0 cursor-zoom-in"
          >
            <Image
              src={cover}
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 768px"
              className="object-cover"
            />
          </button>
        ) : (
          <PhotoPlaceholder name={name} className="h-full w-full" />
        )}

        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"
        />
        <div className="pointer-events-none absolute right-4 bottom-3 left-4 text-white">
          <h1 className="text-2xl font-semibold">{name}</h1>
          <p className="text-sm text-white/85">{subtitle}</p>
        </div>
      </div>

      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
          onIndex={setOpen}
        />
      )}
    </>
  );
}

/** A grid of thumbnails; clicking one opens it full size. */
export function PhotoGrid({ photos }: { photos: string[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ul className="grid grid-cols-3 gap-2">
        {photos.map((url, at) => (
          <li key={url}>
            <button
              type="button"
              onClick={() => setOpen(at)}
              aria-label={`Photo ${at + 1} of ${photos.length}`}
              className="relative block aspect-square w-full cursor-zoom-in overflow-hidden rounded-xl"
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="240px"
                className="object-cover transition-transform duration-200 hover:scale-105"
              />
            </button>
          </li>
        ))}
      </ul>

      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onClose={() => setOpen(null)}
          onIndex={setOpen}
        />
      )}
    </>
  );
}
