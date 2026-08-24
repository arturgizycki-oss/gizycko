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

`npm run db` prints a `DATABASE_URL` and a `SHADOW_DATABASE_URL`. **The port can
change between runs** — if the app cannot connect, copy the new URLs into `.env`.

Keep that terminal open. If pages start failing with *"Connection terminated
unexpectedly"*, the database has stopped even though its port may still look
open. Restart it, and if it complains that the lock file is held, the previous
process died badly — delete
`%LOCALAPPDATA%\prisma-dev-nodejs\Data\durable-streams\gizycko\server.lock.lock`
and start it again. Never run two copies at once; they fight over the same data
files and every connection is dropped.

First time only:

```bash
npm run db:migrate    # create the tables
npm run db:seed       # four test profiles, password: seedpassword123
```

Then open http://localhost:3000. `ania@seed.test` is an ADMIN, so `/moderation`
works when signed in as her.

## Useful commands

| Command | What it does |
| --- | --- |
| `npm run dev` | Dev server on :3000 |
| `npm run build` | Production build |
| `npm test` | Run the test suite (needs the local database running) |
| `npm run db` | Start the local Postgres |
| `npm run db:migrate` | Create/apply a migration after editing the schema |
| `npm run db:seed` | Insert test users and profiles |
| `npm run db:studio` | Browse the database in a GUI |

## Layout

```
prisma/schema.prisma      the whole data model
src/lib/auth.ts           Better Auth config (server)
src/lib/auth-client.ts    Better Auth hooks (client)
src/lib/session.ts        getSession / requireSession / requireProfile / requireModerator
src/lib/matching.ts       swipe + match creation
src/lib/social.ts         friends, blocks, matched-user lookups
src/lib/storage.ts        object storage behind one interface
src/lib/image.ts          upload validation by magic bytes
src/lib/mail.ts           outbound email behind one function
src/lib/age.ts            age and the 18+ rule
src/lib/actions/          safety (block/report) and friend server actions
src/app/(auth)/           sign-in, sign-up, forgot/reset password
src/app/(legal)/          terms, privacy, safety
src/app/onboarding/       profile creation, 18+ check
src/app/(app)/            feed, discover, matches, friends, notifications, profile, moderation
```

Every page under `src/app/(app)/` requires a session. Pages calling
`requireProfile()` also require a finished profile and send everyone else to
`/onboarding`. `/moderation` additionally requires `role` of `MODERATOR` or
`ADMIN`, and 404s for everyone else.

## What works

**Accounts** — email + password sign-up, sign-in, sign-out, email verification,
password reset, account deletion, and a GDPR data export at `/api/me/export`.

**Profiles** — onboarding with a server-side 18+ check, profile editing, photo
upload (up to 6, validated by magic bytes not by filename), main-photo
selection, and a generated gradient avatar for anyone without a picture.

**Dating** — Discover filters candidates by mutual gender preference, age range,
blocks, and people already swiped. Mutual likes create exactly one match and
notify both sides once. Each match has a private conversation with 5-second
polling, unmatch, block, and report.

**Social** — posts carrying text, up to 4 photos, one song, and one video, with
per-post visibility (public / friends / matches / private). Reactions, comments,
post deletion, friend requests with accept/decline, a friends page with
collapsible sections and suggestions, public profiles at `/u/[id]`, and a
notifications page. The feed sorts by newest / most liked / most discussed and
filters by author (everyone, friends, matches, just me) and by attachment
(photos, video, song) — all through URL params, so a view can be shared.

**Messages** — `/messages` lists every conversation with unread counts, previews
and timestamps, plus search, an All/Unread filter, mark read/unread, and mark
all read. Inside a chat you can delete your own messages.

**Safety** — block and report from any profile, post, comment, or message.
Blocking hides both people from each other and ends any match. A moderation
queue at `/moderation` handles reports, photo review, and bans; banned users are
signed out, hidden from Discover, and sent to `/banned`.

## Storage and email

Both sit behind one small interface each so production can swap the driver
without touching any page:

- **`src/lib/storage.ts`** — the local driver writes under `STORAGE_DIR`
  (`.storage/`, gitignored) and serves through `/api/media/[...key]`. This does
  **not** work on a serverless host with a read-only filesystem: implement
  `putObject`/`getObject`/`deleteObject` against S3, R2, or Supabase Storage
  before deploying.
- **`src/lib/mail.ts`** — with no `MAIL_DRIVER` set, emails are printed to the
  server log, which is why sign-up works with no third-party account. Set
  `MAIL_DRIVER=resend` and `RESEND_API_KEY` for real delivery.

## Tests

```bash
npm test
```

52 tests. `tests/age.test.ts`, `tests/image.test.ts`, `tests/audio.test.ts`, and
`tests/video.test.ts` are pure unit tests;
`tests/storage.test.ts` uses a temp directory; `tests/matching.test.ts` runs
against the local database and prefixes every fixture id with `test-match-` so
cleanup never touches seeded or real rows.

## Not built yet

- Nested comment replies (the `parentId` column exists, the UI is flat)
- Video thumbnails and transcoding — videos play as uploaded, so a large file
  stays large
- Distance filtering — `latitude`/`longitude`/`maxDistanceKm` are stored and
  editable but Discover does not yet filter on them
- Rate limiting on sign-up, swipes, and messages
- Real-time chat (currently 5-second polling)
- Cookie/consent banner

## Before this goes live

- **The legal pages are drafts.** `/terms` and `/privacy` are written for a
  Polish/EU dating service but have not been reviewed by a lawyer, and carry a
  visible warning saying so. The placeholders in square brackets (company name,
  address, NIP, contact email, processor names) must be filled in.
- Swap the storage driver for a real bucket (see above).
- Configure a real mail driver, and consider turning on
  `requireEmailVerification` in `src/lib/auth.ts` once mail is reliable.
- Add rate limiting before opening sign-up to the public.
- Photo moderation is **reactive**: uploads are visible immediately and hidden
  only once a moderator rejects them. If you want pre-moderation instead, change
  Discover and the public profile to require `moderation === "APPROVED"`.

## Hosting

This is a Node.js app and **cannot run on Namecheap shared cPanel hosting**.
Deploy to Vercel (or any Node host) and point gizycko.online's nameservers
there, with a hosted Postgres such as Neon or Supabase.
