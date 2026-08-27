import { it, expect } from "vitest";
import { prisma } from "@/lib/prisma";

const P = "test-filter-";

/** The three shapes an account can be in, as the admin page sees them. */
it("the No profile filter finds accounts with no profile row", async () => {
  await prisma.user.deleteMany({ where: { id: { startsWith: P } } });

  // Signed up and stopped: no profile row at all.
  await prisma.user.create({
    data: { id: P + "none", name: "none", email: P + "none@test.invalid" },
  });
  // Started a profile but never finished it.
  await prisma.user.create({
    data: {
      id: P + "half",
      name: "half",
      email: P + "half@test.invalid",
      profile: {
        create: {
          displayName: "Half",
          birthDate: new Date("1990-01-01"),
          gender: "MAN",
          interestedIn: ["WOMAN"],
          completedAt: null,
        },
      },
    },
  });
  // Finished.
  await prisma.user.create({
    data: {
      id: P + "done",
      name: "done",
      email: P + "done@test.invalid",
      profile: {
        create: {
          displayName: "Done",
          birthDate: new Date("1990-01-01"),
          gender: "MAN",
          interestedIn: ["WOMAN"],
          completedAt: new Date(),
        },
      },
    },
  });

  const where = {
    id: { startsWith: P },
    OR: [{ profile: { is: null } }, { profile: { is: { completedAt: null } } }],
  };

  const found = await prisma.user.findMany({ where, select: { id: true } });
  const ids = found.map((u) => u.id).sort();

  expect(ids).toEqual([P + "half", P + "none"]);

  // What the overview counts, which must agree with the filter.
  const members = await prisma.user.count({ where: { id: { startsWith: P } } });
  const completed = await prisma.profile.count({
    where: { userId: { startsWith: P }, completedAt: { not: null } },
  });
  expect(members - completed).toBe(ids.length);

  await prisma.user.deleteMany({ where: { id: { startsWith: P } } });
});
