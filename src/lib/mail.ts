export type Mail = {
  to: string;
  subject: string;
  text: string;
};

/**
 * Outbound email behind one function.
 *
 * With no MAIL_DRIVER set, messages are printed to the server log — that is
 * what dev uses, and it means sign-up works with no third-party account. For
 * production set MAIL_DRIVER=resend and RESEND_API_KEY, or implement your own
 * branch here for SMTP.
 */
export async function sendMail(mail: Mail): Promise<void> {
  const driver = process.env.MAIL_DRIVER ?? "log";

  if (driver === "resend") {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.MAIL_FROM ?? "no-reply@gizycko.online";
    if (!apiKey) throw new Error("RESEND_API_KEY is not set");

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: mail.to,
        subject: mail.subject,
        text: mail.text,
      }),
    });

    if (!response.ok) {
      throw new Error(`Sending mail failed: ${response.status} ${await response.text()}`);
    }
    return;
  }

  console.info(
    [
      "",
      "──────── email (dev, not actually sent) ────────",
      `to:      ${mail.to}`,
      `subject: ${mail.subject}`,
      "",
      mail.text,
      "───────────────────────────────────────────────",
      "",
    ].join("\n"),
  );
}
