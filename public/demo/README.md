# Demo images

These are **placeholders for development**, not assets you own.

| File | Used for | Source |
| --- | --- | --- |
| `ania.jpg`, `marek.jpg`, `kasia.jpg`, `piotr.jpg` | seeded profile photos and the landing page | i.pravatar.cc (serves Unsplash photos) |
| `../hero.jpg` | landing page hero | picsum.photos id 1011 (Unsplash) |

## Before launch, replace them

The Unsplash Licence allows free commercial use, but it does **not** grant the
right to imply that an identifiable person endorses or uses a product. Showing
these faces on the landing page as if they were members of gizycko crosses that
line.

Replace the portraits with one of:

- photographs of real, consenting members;
- stock images bought with a model release that covers this use;
- your own photography.

`hero.jpg` shows nobody identifiable, so it is the least risky of the set — but
check the licence before shipping it too.

The seeded profile photos never reach production: they are written by
`npm run db:seed`, which is a development command.
