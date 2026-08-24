import Link from "next/link";
import { requireSession } from "@/lib/session";
import { CollapsibleSection } from "@/components/collapsible-section";

export const metadata = { title: "Help" };

const FAQ = [
  {
    q: "How does matching work?",
    a: "Discover shows people who match your preferences — the genders you want to meet, your age range, and who has not been blocked. Like someone and nothing happens on their side until they like you back. When you both do, it becomes a match and a conversation opens.",
  },
  {
    q: "What is the difference between a match and a friend?",
    a: "A match comes from Discover and is about dating. A friend is a social connection: friends see each other's friends-only posts and can message without ever swiping. Matches appear under Matches, and every conversation of either kind appears under Messages.",
  },
  {
    q: "Who can see my posts?",
    a: "You choose per post: everyone, friends, matches, or only you. Change it in the dropdown next to the Post button before you publish.",
  },
  {
    q: "Why can nobody see my profile?",
    a: "Check that your profile is set to visible on your profile page, and that your age and distance preferences are not so narrow that few people qualify. Profiles without a photo also get far less attention.",
  },
  {
    q: "Someone is bothering me. What do I do?",
    a: "Block them, and report them. Blocking hides you from each other, ends any match, and stops all messages — they are never told. Reporting sends the details to our moderators. Both buttons are on every profile, post, comment, and conversation.",
  },
  {
    q: "How do I delete my account?",
    a: "Settings, then Delete my account. It removes your profile, photos, matches, messages, and posts. You can download everything first with Download my data.",
  },
];

export default async function HelpPage() {
  await requireSession();

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold tracking-tight">Help</h1>
        <p className="muted text-sm">
          The questions people ask most. If yours is not here, write to us.
        </p>
      </div>

      {FAQ.map((item, index) => (
        <CollapsibleSection
          key={item.q}
          title={item.q}
          order={index + 1}
          defaultOpen={index === 0}
        >
          <p className="px-2 py-2 text-sm text-[var(--ink-muted)]">{item.a}</p>
        </CollapsibleSection>
      ))}

      <section className="card p-4">
        <h2 className="text-sm font-medium">Still stuck?</h2>
        <p className="muted mt-2 text-sm">
          Email <strong>[support email]</strong> and tell us what happened. If it
          is about another member, include their name so moderators can find
          them.
        </p>
        <p className="hint mt-3">
          In an emergency in Poland call <strong>112</strong>. Our{" "}
          <Link href="/safety" className="underline">
            safety advice
          </Link>{" "}
          covers meeting someone for the first time.
        </p>
      </section>
    </div>
  );
}
