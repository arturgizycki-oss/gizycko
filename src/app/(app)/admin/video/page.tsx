import { requireModerator } from "@/lib/session";
import { MediaReview } from "../media-review";

export default async function AdminVideoPage() {
  await requireModerator();
  return <MediaReview kind="video" />;
}
