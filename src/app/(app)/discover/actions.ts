"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { recordSwipe } from "@/lib/matching";
import type { SwipeDirection } from "@/generated/prisma/enums";

export type SwipeResult = { matched: boolean };

export async function swipe(
  toUserId: string,
  direction: SwipeDirection,
): Promise<SwipeResult> {
  const session = await requireSession();

  const outcome = await recordSwipe(session.user.id, toUserId, direction);

  revalidatePath("/discover");
  return { matched: outcome.matched };
}
