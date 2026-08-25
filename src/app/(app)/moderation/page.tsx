import { redirect } from "next/navigation";

/**
 * The moderation queue moved under /admin, which is one place for everything
 * staff do. Kept as a redirect because the link from a profile page, and any
 * bookmark a moderator already made, still point here.
 */
export default function ModerationPage() {
  redirect("/admin/reports");
}
