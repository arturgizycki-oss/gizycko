import Link from "next/link";
import { requireSession } from "@/lib/session";
import { CollapsibleSection } from "@/components/collapsible-section";
import { getTranslator } from "@/lib/i18n";
import type { MessageKey } from "@/lib/i18n";

export const metadata = { title: "Help" };

/** Question and answer keys, in the order they are shown. */
const FAQ: { q: MessageKey; a: MessageKey }[] = [
  { q: "help.q1", a: "help.a1" },
  { q: "help.q2", a: "help.a2" },
  { q: "help.q3", a: "help.a3" },
  { q: "help.q4", a: "help.a4" },
  { q: "help.q5", a: "help.a5" },
  { q: "help.q6", a: "help.a6" },
];

export default async function HelpPage() {
  await requireSession();
  const t = await getTranslator();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">
          {t("help.title")}
        </h1>
        <p className="muted text-sm">{t("help.intro")}</p>
      </div>

      {FAQ.map((item, index) => (
        <CollapsibleSection
          key={item.q}
          title={t(item.q)}
          order={index + 1}
          defaultOpen={index === 0}
        >
          <p className="px-2 py-2 text-sm text-[var(--ink-muted)]">
            {t(item.a)}
          </p>
        </CollapsibleSection>
      ))}

      <section className="card p-4">
        <h2 className="text-sm font-medium">{t("help.stuck")}</h2>
        <p className="muted mt-2 text-sm">
          <strong>[support email]</strong> — {t("help.contact")}
        </p>
        <p className="hint mt-3">
          {t("help.emergency")}{" "}
          <Link href="/safety" className="underline">
            {t("help.safetyLink")}
          </Link>
        </p>
      </section>
    </div>
  );
}
