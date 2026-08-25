import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "./prisma";
import { sendMail } from "./mail";

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
      await sendMail({
        to: user.email,
        subject: "Reset your gizycko password",
        text: [
          "Someone asked to reset the password for this account.",
          "",
          `Open this link to choose a new one: ${url}`,
          "",
          "The link expires in one hour. If this was not you, ignore this email -",
          "your password stays as it is.",
        ].join("\n"),
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      await sendMail({
        to: user.email,
        subject: "Confirm your email address",
        text: [
          `Welcome to gizycko, ${user.name}.`,
          "",
          `Confirm this address to finish setting up your account: ${url}`,
          "",
          "If you did not sign up, ignore this email.",
        ].join("\n"),
      });
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  user: {
    // GDPR: users must be able to erase their account themselves.
    deleteUser: { enabled: true },
    additionalFields: {
      role: { type: "string", defaultValue: "USER", input: false },
      bannedAt: { type: "date", required: false, input: false },
      banReason: { type: "string", required: false, input: false },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
