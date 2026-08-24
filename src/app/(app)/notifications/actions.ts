"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/session";

export async function markAllNotificationsRead() {
  const session = await requireSession();

  const { count } = await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  // The unread badge lives in the layout, which renders before this page did.
  // Revalidating the layout is what actually clears it.
  if (count > 0) revalidatePath("/", "layout");
}
