import Image from "next/image";

/**
 * The photograph behind sign-in and sign-up.
 *
 * A lighter scrim than the signed-in app uses: there is only a small card on
 * top here, so the picture can carry more of the page.
 */
export function AuthBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Image
        src="/login-background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-white/45 dark:bg-neutral-950/65" />
    </div>
  );
}
