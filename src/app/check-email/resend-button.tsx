"use client";

import { useState } from "react";
import { authClient } from "@/lib/auth-client";
import { useT } from "@/lib/i18n/provider";

/**
 * Ask for the confirmation email again.
 *
 * Says "sent" whatever happens. A failure here is not worth a red message on a
 * page whose whole job is to reassure, and the honest advice either way is the
 * same: wait a minute and look in spam.
 */
export function ResendButton({ email }: { email: string }) {
  const t = useT();
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  async function resend() {
    setPending(true);
    try {
      await authClient.sendVerificationEmail({
        email,
        callbackURL: "/onboarding",
      });
    } finally {
      setPending(false);
      setSent(true);
    }
  }

  if (sent) {
    return <span className="text-emerald-600">{t("auth.sentAgain")}</span>;
  }

  return (
    <>
      {t("auth.noEmail")}{" "}
      <button
        type="button"
        disabled={pending}
        onClick={resend}
        className="font-medium underline disabled:opacity-60"
      >
        {t("auth.sendAgain")}
      </button>
    </>
  );
}
