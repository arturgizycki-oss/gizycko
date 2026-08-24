import "dotenv/config";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { auth } from "../src/lib/auth";
import { prisma } from "../src/lib/prisma";
import { mediaUrl, putObject } from "../src/lib/storage";
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
  /** File under public/demo, copied into object storage as their photo. */
  photo: string;
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
    photo: "ania.jpg",
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
    photo: "marek.jpg",
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
    photo: "kasia.jpg",
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
    photo: "piotr.jpg",
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

  const profile = await prisma.profile.upsert({
    where: { userId: user.id },
    create: { userId: user.id, ...data },
    update: data,
  });

  await attachPhoto(user.id, profile.id, person.photo);

  return user;
}

/**
 * Copy a demo photo from public/demo into object storage, so seeded profiles
 * look like real ones. Idempotent: re-running the seed does not duplicate.
 */
async function attachPhoto(userId: string, profileId: string, fileName: string) {
  const already = await prisma.photo.count({ where: { profileId } });
  if (already > 0) return;

  const source = path.join(process.cwd(), "public", "demo", fileName);

  let bytes: Buffer;
  try {
    bytes = await readFile(source);
  } catch {
    console.warn(`  no demo photo at ${source} — skipping`);
    return;
  }

  const key = `photos/${userId}/seed-${fileName}`;
  await putObject(key, bytes);

  await prisma.photo.create({
    data: {
      profileId,
      url: mediaUrl(key),
      position: 0,
      isPrimary: true,
      moderation: "APPROVED",
    },
  });
}


/** A short sine-wave WAV, so the demo song is generated rather than copied. */
function makeToneWav(seconds = 4, freq = 220, rate = 22050): Buffer {
  const samples = seconds * rate;
  const data = Buffer.alloc(samples * 2);

  for (let i = 0; i < samples; i += 1) {
    const fade = Math.min(1, i / (rate * 0.2), (samples - i) / (rate * 0.5));
    const wobble = Math.sin((2 * Math.PI * 3 * i) / rate) * 6;
    const value = Math.sin((2 * Math.PI * (freq + wobble) * i) / rate) * fade * 0.3;
    data.writeInt16LE(Math.round(value * 32767), i * 2);
  }

  const header = Buffer.alloc(44);
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(rate, 24);
  header.writeUInt32LE(rate * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write("data", 36);
  header.writeUInt32LE(data.length, 40);

  return Buffer.concat([header, data]);
}

async function seedSocial(byEmail: Map<string, string>) {
  const id = (email: string) => byEmail.get(email)!;

  // A small social graph, so profiles have friends and mutual friends to show.
  const FRIENDSHIPS: [string, string, "ACCEPTED" | "PENDING"][] = [
    ["ania@seed.test", "kasia@seed.test", "ACCEPTED"],
    ["kasia@seed.test", "marek@seed.test", "ACCEPTED"],
    ["kasia@seed.test", "piotr@seed.test", "ACCEPTED"],
    ["marek@seed.test", "piotr@seed.test", "ACCEPTED"],
    // Left pending so the Friends page has a request to answer.
    ["piotr@seed.test", "ania@seed.test", "PENDING"],
  ];

  for (const [from, to, status] of FRIENDSHIPS) {
    await prisma.friendship.upsert({
      where: {
        requesterId_addresseeId: { requesterId: id(from), addresseeId: id(to) },
      },
      create: {
        requesterId: id(from),
        addresseeId: id(to),
        status,
        respondedAt: status === "ACCEPTED" ? new Date() : null,
      },
      update: { status },
    });
  }

  if ((await prisma.post.count()) > 0) {
    console.log("posts already seeded — skipping those");
    return;
  }

  await prisma.post.create({
    data: {
      authorId: id("kasia@seed.test"),
      body: "Sunrise over the lake this morning. Worth the 4am alarm.",
      visibility: "PUBLIC",
      images: { create: [{ url: "/hero.jpg", position: 0 }] },
    },
  });

  await prisma.post.create({
    data: {
      authorId: id("marek@seed.test"),
      body: "Rebuilt my coffee setup for the third time this year. My flatmates have stopped asking.",
      visibility: "PUBLIC",
    },
  });

  // A song, generated on the spot and pushed through object storage.
  const wav = makeToneWav();
  const songKey = `songs/${id("piotr@seed.test")}/seed-demo-track.wav`;
  await putObject(songKey, wav);

  await prisma.post.create({
    data: {
      authorId: id("piotr@seed.test"),
      body: "Messing about with a synth. Four seconds is all you are getting.",
      visibility: "PUBLIC",
      audioUrl: mediaUrl(songKey),
      audioTitle: "Demo Track",
      audioType: "audio/wav",
    },
  });

  await prisma.post.create({
    data: {
      authorId: id("ania@seed.test"),
      body: "Friends only: anyone free for climbing at the wall on Thursday?",
      visibility: "FRIENDS",
    },
  });

  await prisma.post.create({
    data: {
      authorId: id("kasia@seed.test"),
      body: "Darkroom day. Nothing beats watching a print come up in the tray.",
      visibility: "PUBLIC",
    },
  });

  await prisma.post.create({
    data: {
      authorId: id("kasia@seed.test"),
      body: "Anyone up for the Tatras the weekend after next? I have a spare seat in the car.",
      visibility: "FRIENDS",
    },
  });

  console.log(`seeded posts and ${FRIENDSHIPS.length} friendships`);
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

  await seedSocial(new Map(created.map((u) => [u.email, u.id])));

  console.log(`All seed accounts use the password: ${PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
