import type { PhotoCredit } from "@/lib/photo-credits";

/**
 * The attribution line a CC BY-SA photograph requires, naming the photographer
 * and linking the licence.
 */
export function PhotoCreditLine({ photo }: { photo: PhotoCredit }) {
  return (
    <p className="pointer-events-auto absolute right-2 bottom-1 text-[10px] text-neutral-500/80">
      Giżycko ·{" "}
      <a
        href={photo.source}
        target="_blank"
        rel="noreferrer noopener"
        className="underline"
      >
        {photo.author}
      </a>{" "}
      /{" "}
      <a
        href={photo.licenceUrl}
        target="_blank"
        rel="noreferrer noopener"
        className="underline"
      >
        {photo.licence}
      </a>
    </p>
  );
}
