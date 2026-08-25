import { requireModerator } from "@/lib/session";
import { MediaReview } from "../media-review";

export default async function AdminMusicPage() {
  await requireModerator();
  return <MediaReview kind="audio" />;
}
