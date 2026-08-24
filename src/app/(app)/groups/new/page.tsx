import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { NewGroupForm } from "./new-group-form";

export const metadata = { title: "New group" };

export default async function NewGroupPage() {
  await requireProfile();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/groups" className="muted text-sm hover:underline">
        ← Groups
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">New group</h1>
        <p className="muted text-sm">
          You will be its owner, and can invite people once it exists.
        </p>
      </div>

      <NewGroupForm />
    </div>
  );
}
