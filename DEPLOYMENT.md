# Putting Gizycko online, step by step

Written for someone who has never deployed a website. Follow it in order. After
each part there is a **Check** - do not move on until it passes.

---

## First: can I use Namecheap?

**Your domain - yes.** `gizycko.online` is yours and we will use it. That is the
name people type. It stays at Namecheap.

**Your hosting plan - no.** Not for this site.

Here is why, in plain words. Namecheap's hosting is built for simple websites
(the kind WordPress makes). Those sites just hand out ready-made pages.

Gizycko is different. It has to *think* on every visit - work out who you are,
who to show you, whether you have new messages. For that it needs a program
running all the time, like a shop assistant who is always there. Namecheap's
plan does not give you that.

So we keep the domain at Namecheap and rent the "shop" somewhere built for it.
That place is called **Vercel**, and for a site this size it is free.

Your hosting plan is not wasted - you can still use it for email at your domain,
or a small "coming soon" page. It just cannot run Gizycko.

---

## The four pieces

Think of it like opening a real shop.

| Piece | In plain words | Who |
| --- | --- | --- |
| Domain | The address on the door | Namecheap (you have it) |
| Hosting | The shop itself, where the work happens | Vercel |
| Database | The filing cabinet: members, messages, posts | Supabase |
| File storage | The photo album: pictures, videos, voice notes | Supabase |
| Email sender | The post office, for "confirm your address" | Resend |

All four are free to begin with. None asks for a card to sign up.

---

## Part 1 - Supabase (the filing cabinet and photo album)

1. Go to **supabase.com** and click **Start your project**. Sign in with GitHub
   or an email address.
2. Click **New project**.
   - **Name:** `gizycko`
   - **Database Password:** click Generate, then **copy it and save it
     somewhere safe**. You cannot see it again.
   - **Region:** pick the one nearest your members. `Central EU (Frankfurt)` is
     right for Poland.
3. Wait about two minutes while it builds.

Now collect three things. Keep them in a note - you will paste them later.

4. **The pooled address.** Click **Connect** at the top of the page. Find
   **Transaction pooler**. Copy that line. It starts `postgresql://`.
   Replace `[YOUR-PASSWORD]` in it with the password from step 2. Then add
   `?pgbouncer=true` at the very end.
   Label this note **DATABASE_URL**.
5. **The direct address.** On the same screen find **Direct connection**. Copy
   it, and put your password in it the same way. No `?pgbouncer=true` this time.
   Label it **DIRECT_URL**.
6. **The keys.** Go to **Project Settings** (the gear) > **API**.
   - Copy **Project URL** - label it **SUPABASE_URL**.
   - Copy the **service_role** key - label it **SUPABASE_SERVICE_ROLE_KEY**.

   That second key is like the master key to your building. Keep it private.
   It goes into Vercel later and nowhere else - never in a message, a
   screenshot, or the code.
7. **The photo album.** In the left menu click **Storage** > **New bucket**.
   Name it exactly `media`. Leave **Public bucket** switched **off**, then
   create it.

**Check:** you have five notes - DATABASE_URL, DIRECT_URL, SUPABASE_URL,
SUPABASE_SERVICE_ROLE_KEY - and a bucket called `media` that is not public.

---

## Part 2 - Resend (the post office)

This is what sends "confirm your email" and "reset your password". Without it,
anyone who forgets their password is stuck forever.

1. Go to **resend.com** and sign up.
2. Click **Domains** > **Add Domain**. Type `gizycko.online`.
3. Resend shows you a few DNS records. Leave that page open.
4. In another tab open **Namecheap** > **Domain List** > **Manage** next to
   `gizycko.online` > **Advanced DNS**.
5. For each record Resend shows, click **Add New Record** and copy it across.
   The Type, Host and Value must match exactly.
6. Back in Resend, click **Verify**. It usually takes a few minutes. If it does
   not work at once, wait and press it again.
7. Once verified, go to **API Keys** > **Create API Key**. Copy it. Label the
   note **RESEND_API_KEY**.

**Check:** Resend shows `gizycko.online` as **Verified**, and you have the key.

---

## Part 3 - GitHub (where the code lives)

Vercel reads your code from GitHub, so the code has to be there first.

1. Sign up at **github.com** if you have not already.
2. Click **+** (top right) > **New repository**.
   - **Name:** `gizycko`
   - Choose **Private**.
   - Do **not** tick any of the "Initialize" boxes.
   - Click **Create repository**.
3. Tell me when this is done and send me the address it shows you
   (`https://github.com/yourname/gizycko.git`). I will send the code up for you.

**Check:** refreshing the GitHub page shows your project files.

---

## Part 4 - Vercel (the shop)

1. Go to **vercel.com** and **Sign up with GitHub**.
2. Click **Add New** > **Project**. Find `gizycko` and click **Import**.
3. Before pressing Deploy, open **Environment Variables** and add each row
   below. Name on the left, your note on the right.

```
DATABASE_URL                 your pooled address from Part 1
DIRECT_URL                   your direct address from Part 1
BETTER_AUTH_SECRET           ask me and I will generate one
BETTER_AUTH_URL              https://gizycko.online
NEXT_PUBLIC_APP_URL          https://gizycko.online

STORAGE_DRIVER               supabase
SUPABASE_URL                 your project URL from Part 1
SUPABASE_SERVICE_ROLE_KEY    your service_role key from Part 1
SUPABASE_STORAGE_BUCKET      media

MAIL_DRIVER                  resend
RESEND_API_KEY               your key from Part 2
MAIL_FROM                    no-reply@gizycko.online
```

4. Click **Deploy** and wait. Two to four minutes is normal.

**Check:** Vercel shows **Ready** and gives you a link ending `.vercel.app`.
Open it. The site should appear. If it shows an error instead, copy the message
from the **Logs** tab and send it to me.

---

## Part 5 - Your own address

Right now the site answers on a Vercel link. Let us put your name on it.

1. In Vercel: **Settings** > **Domains** > type `gizycko.online` > **Add**.
2. Vercel shows you the DNS records it wants. Usually:

   | Type | Host | Value |
   | --- | --- | --- |
   | A | `@` | `76.76.21.21` |
   | CNAME | `www` | `cname.vercel-dns.com` |

   **Use whatever Vercel shows you**, not what is written here, if they differ.
3. At Namecheap > **Advanced DNS**, add those records.
   - If there is already an A record for `@` pointing somewhere else, delete it.
   - Under the **Domain** tab, **Nameservers** must be set to **Namecheap
     BasicDNS**, or your records are ignored.
4. Wait. Minutes usually, but it can take a few hours. Vercel turns the domain
   green when it is ready and switches on the padlock (HTTPS) by itself.

**Check:** `https://gizycko.online` opens your site with a padlock.

---

## Part 6 - Make yourself the boss

1. On the live site, create your account and confirm the email.
2. In Supabase: **Table Editor** > `user` table > find your row.
3. Change **role** from `USER` to `ADMIN` and save.

**Check:** `https://gizycko.online/moderation` opens for you.

---

## If something goes wrong

Nothing here can break your domain permanently, and nothing costs money by
accident. If a step fails, send me:

- which Part and which number,
- what you expected,
- what it actually said (a screenshot is fine).

---

## Two things to sort before you invite real people

1. **The legal pages are unfinished.** Terms, Privacy and Safety still contain
   `[company name]`, `[registered address]`, `[contact email]` and
   `[Governing law]`. A dating site handles some of the most protected personal
   data there is, so a lawyer should read those pages. I cannot invent your
   company details.
2. **Large uploads.** Vercel limits what a single upload can carry to about
   4.5 MB. Photos are usually fine. Songs and long videos will be refused until
   I finish the direct-upload path - the groundwork is written, and I need your
   live Supabase project to test it against.
