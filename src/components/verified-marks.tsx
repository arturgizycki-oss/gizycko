import { CardIcon, MailIcon, PhoneIcon } from "./icons";

export type Verified = {
  email: boolean;
  phone: boolean;
  payment: boolean;
};

/**
 * What somebody has proved about themselves, as three marks.
 *
 * Lit means checked, unlit means not yet - and the unlit ones are shown rather
 * than hidden on purpose. A row that only ever appears when full says nothing
 * about the profile that has none, and the absence is the useful half: on a
 * dating site the question a stranger's profile has to answer is how much of it
 * anybody has confirmed.
 *
 * Colour alone would leave this meaningless to a colour-blind reader and silent
 * to a screen reader, so each carries its state in words as well.
 */
export function VerifiedMarks({
  verified,
  labels,
  className = "",
}: {
  verified: Verified;
  labels: {
    email: string;
    phone: string;
    payment: string;
    yes: string;
    no: string;
  };
  className?: string;
}) {
  const marks = [
    { key: "email", Icon: MailIcon, on: verified.email, what: labels.email },
    { key: "phone", Icon: PhoneIcon, on: verified.phone, what: labels.phone },
    {
      key: "payment",
      Icon: CardIcon,
      on: verified.payment,
      what: labels.payment,
    },
  ] as const;

  return (
    <ul className={`flex items-center gap-1.5 ${className}`}>
      {marks.map(({ key, Icon, on, what }) => (
        <li
          key={key}
          title={`${what}: ${on ? labels.yes : labels.no}`}
          className={
            on
              ? "text-emerald-600 dark:text-emerald-400"
              : "text-[var(--ink-muted)] opacity-50"
          }
        >
          <Icon className="size-4" />
          <span className="sr-only">
            {what}: {on ? labels.yes : labels.no}
          </span>
        </li>
      ))}
    </ul>
  );
}
