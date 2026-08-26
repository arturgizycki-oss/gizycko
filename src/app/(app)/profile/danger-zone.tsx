import { getTranslator } from "@/lib/i18n";

/**
 * What a member can do with their own data.
 *
 * Downloading it, and nothing else. Deleting an account is an admin's job -
 * see deleteMember in the admin actions - so this no longer offers a button
 * that erased everything somebody had written, behind one password.
 *
 * The download stays because it answers a different question. Somebody who
 * wants their data out, or wants to check what is held, should not have to ask
 * anybody for it.
 *
 * No longer a client component: with the delete flow gone there is no state
 * left to hold, and a panel of static text should not ship JavaScript.
 */
export async function DangerZone() {
  const t = await getTranslator();

  return (
    <section className="card p-4">
      <h2 className="text-sm font-medium">{t("danger.title")}</h2>

      <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
        {t("danger.body")}
      </p>

      <div className="mt-3">
        <a href="/api/me/export" className="btn btn-secondary btn-sm">
          {t("danger.download")}
        </a>
      </div>

      <p className="hint mt-3">{t("danger.deleteByRequest")}</p>
    </section>
  );
}
