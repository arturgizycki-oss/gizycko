import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendMail } from "./mail";
import { renderEmail } from "./email-template";
import { deleteMemberFiles } from "./member-files";

/**
 * Where somebody lands after confirming.
 *
 * Better Auth builds the link with a callback of "/", which drops a brand new
 * member on the marketing page they signed up from - signed in, with nothing
 * telling them it worked. This points it at a page that says so and sends them
 * on. Left alone if the shape of the link ever changes.
 */
function landing(url: string): string {
  try {
    const link = new URL(url);
    link.searchParams.set("callbackURL", "/verified");
    return link.toString();
  } catch {
    return url;
  }
}

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    // No session until the address is confirmed. Signing up therefore does not
    // sign you in, and sign-in is refused until the link in the email is used.
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      const heading = "Choose a new password";
      const lines = [
        "Someone asked to reset the password for this account.",
        "The link below works for one hour.",
      ];
      const footer = [
        "If this was not you, ignore this email. Your password stays as it is, and nobody can change it without opening the link above.",
      ];

      await sendMail({
        to: user.email,
        subject: "Reset your gizycko password",
        text: [heading, "", ...lines, "", url, "", ...footer].join("\n"),
        html: renderEmail({
          preheader: "The link works for one hour.",
          heading,
          paragraphs: lines,
          action: { label: "Choose a new password", url },
          footer,
        }),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      const link = landing(url);
      const heading = `Welcome to gizycko, ${user.name}.`;
      const lines = [
        "One step left: confirm this is your address and your account is ready.",
        "Until then you cannot sign in, which is what stops anybody signing up as you.",
      ];
      const footer = [
        "If you did not sign up, ignore this email. The account cannot be used until somebody opens the link, so nothing happens if you do nothing.",
      ];

      await sendMail({
        to: user.email,
        subject: "Confirm your email address",
        text: [heading, "", ...lines, "", link, "", ...footer].join("\n"),
        html: renderEmail({
          preheader: "One step left before your account is ready.",
          heading,
          paragraphs: lines,
          action: { label: "Confirm my email", url: link },
          footer,
        }),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    // GDPR: users must be able to erase their account themselves.
    deleteUser: {
      enabled: true,
      // The row cascades, but nothing in a cascade reaches the bucket. Without
      // this, "Delete my account" would leave the member's photographs behind.
      beforeDelete: async (user: { id: string }) => {
        await deleteMemberFiles(user.id);
      },
    },
    additionalFields: {
      role: { type: "string", defaultValue: "USER", input: false },
      bannedAt: { type: "date", required: false, input: false },
      banReason: { type: "string", required: false, input: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
