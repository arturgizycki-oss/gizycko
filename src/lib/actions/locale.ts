"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/session";
import { findLocale } from "@/lib/i18n/locales";
import { LOCALE_COOKIE } from "@/lib/i18n";

/**
 * Change the interface language.
 *
 * Saved on the account when signed in, so it follows the person between
 * devices, and always mirrored into a cookie so the choice survives sign-out
 * and applies to the landing and sign-in pages too.
 */
export async function setLocale(code: string) {
  if (!findLocale(code)) return;

  const session = await getSession();
  if (session) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { locale: code },
    });
  }

  const store = await cookies();
  store.set(LOCALE_COOKIE, code, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
