"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

/** Turn the email nudge about unread messages on or off. */
export async function setEmailOnMessage(enabled: boolean) {
  const session = await requireSession();

  await prisma.user.update({
    where: { id: session.user.id },
    data: { emailOnMessage: enabled },
  });

  revalidatePath("/settings");
}
