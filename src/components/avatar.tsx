import Image from "next/image";

/** Stable hue per name, so the same person always gets the same colours. */
function hueFrom(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i += 1) {
    hash = (hash * 31 + name.charCodeAt(i)) % 360;
  }
  return hash;
}

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  const letters = parts.map((part) => part[0] ?? "").join("");
  return (letters || "?").toUpperCase();
}

/**
 * Profile picture. Falls back to a generated gradient with initials, which
 * keeps every list looking intentional before anyone uploads a photo.
 */
export function Avatar({
  name,
  src,
  size = 40,
  rounded = "full",
  className = "",
}: {
  name: string;
  src?: string | null;
  size?: number;
  rounded?: "full" | "xl";
  className?: string;
}) {
  const radius = rounded === "full" ? "rounded-full" : "rounded-xl";

  if (src) {
    return (
      <Image
        src={src}
        alt=""
        width={size}
        height={size}
        style={{ width: size, height: size }}
        className={`${radius} object-cover ${className}`}
      />
    );
  }

  const hue = hueFrom(name);

  return (
    <span
      aria-hidden
      style={{
        width: size,
        height: size,
        fontSize: Math.max(11, Math.round(size * 0.38)),
        backgroundImage: `linear-gradient(135deg, hsl(${hue} 70% 62%), hsl(${(hue + 48) % 360} 72% 48%))`,
      }}
      className={`${radius} inline-flex shrink-0 items-center justify-center font-semibold text-white select-none ${className}`}
    >
      {initialsFrom(name)}
    </span>
  );
}

/**
 * Large stand-in for a profile that has no photos yet - same colour logic as
 * Avatar so a person looks consistent across the app.
 */
export function PhotoPlaceholder({
  name,
  className = "",
}: {
  name: string;
  className?: string;
}) {
  const hue = hueFrom(name);

  return (
    <div
      aria-hidden
      style={{
        backgroundImage: `radial-gradient(120% 120% at 20% 10%, hsl(${hue} 78% 68%) 0%, hsl(${(hue + 40) % 360} 68% 45%) 55%, hsl(${(hue + 80) % 360} 60% 32%) 100%)`,
      }}
      className={`flex items-center justify-center ${className}`}
    >
      <span className="text-6xl font-bold text-white/85 select-none">
        {initialsFrom(name)}
      </span>
    </div>
  );
}
