import Image from "next/image";
import Link from "next/link";

/** The Gizycko mark plus wordmark, used in every header. */
export function Brand({
  href = "/",
  size = 28,
  showName = true,
  className = "",
}: {
  href?: string;
  size?: number;
  showName?: boolean;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-semibold tracking-tight ${className}`}
      aria-label="Gizycko"
    >
      <Image
        src="/logo.png"
        alt=""
        width={size}
        height={size}
        priority
        style={{ width: size, height: size }}
        className="rounded-full"
      />
      {showName && <span>Gizycko</span>}
    </Link>
  );
}
