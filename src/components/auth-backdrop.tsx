"use client";

import { usePathname } from "next/navigation";
import { PageBackdrop } from "./page-backdrop";
import loginBackground from "@/assets/login.jpg";
import registerBackground from "@/assets/register.jpg";

/**
 * The photograph behind the pages you are not signed in on.
 *
 * Joining and returning are different errands, and the two photographs say so:
 * signing up shows people meeting each other, signing in shows the place they
 * meet. Confirming an address belongs to the joining half - somebody on
 * /check-email is halfway through signing up, and the picture should not
 * change under them mid-journey.
 */
const JOINING = ["/sign-up", "/check-email", "/verified"];

export function AuthBackdrop() {
  const pathname = usePathname();
  const joining = JOINING.some((path) => pathname.startsWith(path));

  return (
    <PageBackdrop
      image={joining ? registerBackground : loginBackground}
      scrim="light"
    />
  );
}
