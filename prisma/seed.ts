import "dotenv/config";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import type { Gender } from "../src/generated/prisma/enums";

type SeedPerson = {
  name: string;
  email: string;
  displayName: string;
  birthDate: string;
  gender: Gender;
  interestedIn: Gender[];
  city: string;
  bio: string;
};

const PASSWORD = "seedpassword123";

const PEOPLE: SeedPerson[] = [
  {
    name: "Ania",
    email: "ania@seed.test",
    displayName: "Ania",
    birthDate: "1995-04-12",
    gender: "WOMAN",
    interestedIn: ["MAN"],
    city: "Warszawa",
    bio: "Climbing, pierogi, and long walks along the Wisła.",
  },
  {
    name: "Marek",
    email: "marek@seed.test",
    displayName: "Marek",
    birthDate: "1992-09-30",
    gender: "MAN",
    interestedIn: ["WOMAN"],
    city: "Warszawa",
    bio: "Backend developer. I will talk about coffee for an hour.",
  },
  {
    name: "Kasia",
    email: "kasia@seed.test",
    displayName: "Kasia",
    birthDate: "1998-01-22",
    gender: "WOMAN",
    interestedIn: ["MAN", "WOMAN"],
    city: "Kraków",
    bio: "Photographer. Looking for someone to explore the Tatras with.",
  },
  {
    name: "Piotr",
    email: "piotr@seed.test",
    displayName: "Piotr",
    birthDate: "1990-06-05",
    gender: "MAN",
    interestedIn: ["WOMAN"],
    city: "Warszawa",
    bio: "Runner, cook, terrible at board games.",
  },
];

async function upsertPerson(person: SeedPerson) {
  let user = await prisma.user.findUnique({ where: { email: person.email } });

  if (!user) {
    await auth.api.signUpEmail({
      body: { name: person.name, email: person.email, password: PASSWORD },
    });
    user = await prisma.user.findUnique({ where: { email: person.email } });
  }

  if (!user) throw new Error(`Could not create ${person.email}`);

  const data = {
    displayName: person.displayName,
    birthDate: new Date(person.birthDate),
    gender: person.gender,
    interestedIn: person.interestedIn,
    city: person.city,
    country: "PL",
    bio: person.bio,
    completedAt: new Date(),
  };

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  return user;
}

async function main() {
  const created = [];
  for (const person of PEOPLE) {
    const user = await upsertPerson(person);
    created.push(user);
    console.log(`seeded ${person.email} (${user.id})`);
  }

  // Seed accounts skip email confirmation so they are usable straight away.
  await prisma.user.updateMany({
    where: { email: { endsWith: "@seed.test" } },
    data: { emailVerified: true },
  });

  // The first account doubles as moderator, so /moderation is reachable in dev.
  const admin = created[0];
  if (admin) {
    await prisma.user.update({
      where: { id: admin.id },
      data: { role: "ADMIN" },
    });
    console.log(`\n${PEOPLE[0].email} is an ADMIN — open /moderation as them.`);
  }

  console.log(`All seed accounts use the password: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
