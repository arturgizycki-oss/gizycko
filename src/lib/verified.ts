import type { Verified } from "@/components/verified-marks";
import type { MessageKey } from "@/lib/i18n";

/** What a row of user columns says about what has been checked. */
export function verifiedOf(user: {
  emailVerified: boolean;
  phoneVerifiedAt: Date | null;
  paymentVerifiedAt: Date | null;
}): Verified {
  return {
    email: user.emailVerified,
    phone: user.phoneVerifiedAt !== null,
    payment: user.paymentVerifiedAt !== null,
  };
}

/** The words for the marks, so the component itself stays free of translation. */
export function verifiedLabels(t: (key: MessageKey) => string) {
  return {
    email: t("verified.email"),
    phone: t("verified.phone"),
    payment: t("verified.payment"),
    yes: t("verified.yes"),
    no: t("verified.no"),
  };
}
