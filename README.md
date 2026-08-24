# gizycko

Dating app with a social feed, for **gizycko.online**.

Next.js 16 (App Router) · TypeScript · Tailwind 4 · Prisma 7 · PostgreSQL · Better Auth

## Running it locally

You need two terminals.

```bash
# terminal 1 — local Postgres (keep it open)
npm run db

# terminal 2 — the app
npm run dev
```

`npm run db` prints a `DATABASE_URL` and a `SHADOW_DATABASE_URL`. **The port changes
between runs** — if the app cannot connect, copy the new URLs into `.env`.

First time only:

```bash
npm run db:migrate    # create the tables
npm run db:seed       # four test profiles, password: seedpassword123
```

Then open http://localhost:3000.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm run db` | Start the local Postgres |
| `npm run db:migrate` | Create/apply a migration after editing the schema |
| `npm run db:seed` | Insert test users and profiles |
| `npm run db:studio` | Browse the database in a GUI |

## Layout

```
prisma/schema.prisma      the whole data model
src/lib/auth.ts           Better Auth config (server)
src/lib/auth-client.ts    Better Auth hooks (client)
src/lib/session.ts        getSession / requireSession / requireProfile
src/lib/matching.ts       swipe + match creation
src/lib/social.ts         friends, blocks, matched-user lookups
src/app/(auth)/           sign-in, sign-up
src/app/onboarding/       profile creation, 18+ check
src/app/(app)/            feed, discover, matches, profile
```

Every page under `src/app/(app)/` requires a session. Pages calling
`requireProfile()` also require a finished profile, and send everyone else to
`/onboarding`.

## Built so far

- Email + password auth, sessions, sign-out
- Onboarding with a server-side 18+ check
- Discover: candidate query filtered by gender preference, age range, blocks,
  and people already swiped
- Swipe, mutual-like matching, match notifications
- Matches list
- Feed: posting with per-post visibility (public / friends / matches / private),
  reactions

## Not built yet

- Photo upload and storage
- Chat inside a match
- Comments, friend requests
- Report / block UI (the tables exist, the screens do not)
- Moderation queue
- Terms, Privacy, Safety pages (linked but missing)
- Email verification and password reset
- Tests

## Before this goes live

The site handles EU personal data, some of it GDPR special-category. Needed
before real users:

- Privacy policy, terms, cookie consent
- Working account deletion (Better Auth's `deleteUser` is enabled; no UI yet)
- Photo moderation — the `Photo.moderation` column exists and is unused
- Report and block flows reachable from every profile, post, and message
- Rate limiting on sign-up, swipes, and messages
