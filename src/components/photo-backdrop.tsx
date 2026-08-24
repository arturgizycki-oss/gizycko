import Image from "next/image";
import type { PhotoCredit } from "@/lib/photo-credits";

/**
 * A full-bleed photograph behind the page, with a scrim so text stays readable
 * and the credit the licence requires. Fixed, so it sits behind content even
 * when rendered from inside a card.
 */
export function PhotoBackdrop({
  photo,
  overlay = "medium",
  priority = false,
}: {
  photo: PhotoCredit;
  overlay?: "light" | "medium" | "heavy";
  priority?: boolean;
}) {
  const scrim = {
    light: "bg-white/55 dark:bg-neutral-950/65",
    medium: "bg-white/75 dark:bg-neutral-950/80",
    heavy: "bg-white/88 dark:bg-neutral-950/90",
  }[overlay];

  return (
    <div aria-hidden={false} className="pointer-events-none fixed inset-0 -z-10">
      <Image
        src={photo.src}
        alt={photo.alt}
        fill
        priority={priority}
        sizes="100vw"
        className="object-cover"
      />
      <div className={`absolute inset-0 ${scrim}`} />
      <PhotoCreditLine photo={photo} />
    </div>
  );
}

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
