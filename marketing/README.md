# Advertising material

Built from the site's own photographs with ffmpeg. The two `.sh` scripts here
rebuild the videos, so changing a headline is an edit and a re-run rather than
starting again.

## The videos

| File | Size | Length | Where it goes |
| --- | --- | --- | --- |
| `gizycko-ad-1080p.mp4` | 1920x1080 | 18.6s | YouTube skippable in-stream, Display, Performance Max |
| `gizycko-bumper-6s.mp4` | 1920x1080 | 5.9s | YouTube bumper (the 6-second cap is hard) |
| `gizycko-ad-vertical.mp4` | 1080x1920 | 18.6s | Shorts, and mobile feeds |

All H.264, `yuv420p`, 25fps, `faststart` — which is what Google Ads accepts
without re-encoding.

## There is no sound

Deliberate. Roughly four in five feed videos are watched muted, so every word
is on screen. But YouTube will not accept a video with no audio track at all on
some placements. If it complains, add silence:

```
ffmpeg -i gizycko-ad-1080p.mp4 -f lavfi -i anullsrc=r=44100:cl=stereo \
  -shortest -c:v copy -c:a aac gizycko-ad-1080p-silent.mp4
```

Better still, lay music over it. Use a track licensed for advertising - not
something from the YouTube Audio Library, whose terms usually stop at
monetised videos and do not cover paid ads.

## Text for the ads themselves

Google's search ads want short lines. These fit the limits: headlines 30
characters, descriptions 90.

**Headlines**

- Meet people nearby
- A dating app with a real side
- Match, chat, share
- Free to join. 18+
- Groups worth joining

**Descriptions**

- A dating app with a real social side. Match, chat, and share what you are up to.
- Every match gets a private conversation. No paywall to reply. Free to join.
- Block and report from any profile, post or message. 18+ only.

## Before you spend money on these

**Check the photographs are licensed for advertising.** Using a picture on your
own site and using it in a paid advert are different permissions under most
stock licences, and the second usually costs more. If these came from a stock
library, read what you bought. If they were generated, check that service's
terms on commercial use. This is the one thing here that can cost you real
money if it is wrong.

**Google restricts dating ads.** Dating advertisers must be certified by Google
before their ads run, and the policy is specific about what the creative may
show and promise. Apply first, or the campaign is rejected and the spend does
nothing. Search for "Google Ads dating certification".

**The legal pages are still drafts.** Terms and Privacy carry `[company name]`
and `[registered address]`. Google checks the landing page of a dating advert,
and placeholders there are a plausible reason to be refused.

## Rebuilding

```
bash marketing/make-ad.sh           # 16:9
bash marketing/make-ad-vertical.sh  # 9:16
```

Both write into a temporary folder; copy the results back into `marketing/`.
Edit the `scene` lines to change a headline or swap a photograph.
