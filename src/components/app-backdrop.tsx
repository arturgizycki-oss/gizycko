import Image from "next/image";

/**
 * The photograph behind the whole signed-in app.
 *
 * Fixed and behind everything, with a heavy scrim over it: the picture sets the
 * mood, but every card and every line of text has to stay readable on top of
 * it, so the scrim does most of the work and the photograph shows through at
 * the edges.
 */
export function AppBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Image
        src="/dashboard-background.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-white/88 dark:bg-neutral-950/90" />
    </div>
  );
}
