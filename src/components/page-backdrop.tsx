import Image, { type StaticImageData } from "next/image";

/**
 * A photograph behind a page, with a scrim over it.
 *
 * The image is a static import rather than a path into public/, so Next puts a
 * content hash in its filename. A replaced photograph then arrives with a new
 * URL and nobody sees a cached copy of the old one — which is exactly what
 * happens with a fixed name like /login-background.jpg.
 */
export function PageBackdrop({
  image,
  scrim = "heavy",
}: {
  image: StaticImageData;
  /** How much the picture is dimmed so text stays readable on top. */
  scrim?: "light" | "medium" | "heavy" | "gradient";
}) {
  const overlay = {
    light: "bg-white/45 dark:bg-neutral-950/65",
    medium: "bg-white/70 dark:bg-neutral-950/80",
    heavy: "bg-white/88 dark:bg-neutral-950/90",
    gradient:
      "bg-gradient-to-b from-white/70 via-white/60 to-white/85 dark:from-neutral-950/75 dark:via-neutral-950/70 dark:to-neutral-950/90",
  }[scrim];

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Image
        src={image}
        alt=""
        fill
        priority
        sizes="100vw"
        placeholder="blur"
        className="object-cover"
      />
      <div className={`absolute inset-0 ${overlay}`} />
    </div>
  );
}
