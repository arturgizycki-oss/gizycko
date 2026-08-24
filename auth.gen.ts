import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";

export const auth = betterAuth({
  database: prismaAdapter({} as never, { provider: "postgresql" }),
  emailAndPassword: { enabled: true, minPasswordLength: 10 },
  user: {
    deleteUser: { enabled: true },
    additionalFields: {
      role: { type: "string", defaultValue: "USER", input: false },
      bannedAt: { type: "date", required: false, input: false },
      banReason: { type: "string", required: false, input: false },
    },
  },
});
