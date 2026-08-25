import Link from "next/link";
import { requireProfile } from "@/lib/session";
import { NewGroupForm } from "./new-group-form";
import { getTranslator } from "@/lib/i18n";
import { ChevronLeftIcon } from "@/components/icons";

export const metadata = { title: "New group" };

export default async function NewGroupPage() {
  await requireProfile();
  const t = await getTranslator();

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <Link href="/groups" className="muted text-sm hover:underline">
        <ChevronLeftIcon className="size-4" />
        {t("groups.title")}
      </Link>

      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("groups.newTitle")}
        </h1>
        <p className="muted text-sm">{t("groups.newIntro")}</p>
      </div>

      <NewGroupForm />
    </div>
  );
}
