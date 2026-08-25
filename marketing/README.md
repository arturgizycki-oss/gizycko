# Advertising material

Built from the site's own photographs with ffmpeg. The `.sh` scripts here
rebuild everything, so changing a headline is an edit and a re-run rather than
starting again.

The films themselves are not in git - they are large, and they are output. The
scripts are what is kept, and they regenerate the lot in a couple of minutes.

## The videos

| File | Size | Length | Where it goes |
| --- | --- | --- | --- |
| `gizycko-ad-1080p.mp4` | 1920x1080 | 18.6s | YouTube skippable in-stream, Display, Performance Max |
| `gizycko-bumper-6s.mp4` | 1920x1080 | 5.9s | YouTube bumper (the 6-second cap is hard) |
| `gizycko-ad-vertical.mp4` | 1080x1920 | 18.6s | Shorts, and mobile feeds |
| `gizycko-ad-20s.mp4` | 1920x1080 | 19.4s | The main cut: in-stream, and the site's own pages |
| `gizycko-ad-7s.mp4` | 1920x1080 | 6.8s | The five beats and the mark, cut out of the main one |

## The GIFs

| File | Size | Length | Weight |
| --- | --- | --- | --- |
| `gizycko-ad-20s.gif` | 480x270 | 19.4s | 7.6 MB |
| `gizycko-ad-7s.gif` | 560x315 | 6.8s | 3.5 MB |

Still heavy for GIFs, and not carelessness: the frame moves continuously, so no
two frames are alike and there is almost nothing for the format to squeeze out.
Width and frame rate are the only levers, and below about 480 wide the second
line of the proof captions stops being readable.

The full one now sits under the 8 MB most chat apps stop at, but only just. If
something refuses it, send `gizycko-ad-7s.gif` rather than shrinking the other:
it carries all five beats and the address, which is the part that works without
sound anyway.

Prefer the `.mp4` wherever it is accepted. It is smaller *and* sharper: 7.2 MB
for the full film against 7.6 MB for a quarter-size GIF of it.

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
bash marketing/make-ad.sh           # 16:9, 18.6s
bash marketing/make-ad-vertical.sh  # 9:16, 18.6s
bash marketing/make-ad-20s.sh       # 16:9, 19.4s
bash marketing/make-gif.sh          # both GIFs, from gizycko-ad-20s.mp4
```

The three video scripts write into a temporary folder; copy the results back
into `marketing/`. `make-gif.sh` reads and writes `marketing/` directly, so run
it after the 30-second film is in place. Edit the `scene`, `beat` and `proof`
lines to change a headline or swap a photograph.

### Why the main cut is short

19.4 seconds, not 30. There are five photographs to work with, and at this pace
they are all used - a longer film would mean showing them twice, which is what
made the first attempt feel like a screensaver. If a placement needs exactly 30,
the honest fix is more photographs rather than longer holds.

### Two things the older scripts get wrong

They dim each photograph by 45% to seat the white type, which is enough to turn
a lake at golden hour into an overcast afternoon. `make-ad-20s.sh` dims by 20%
and gives the type its own drop shadow instead: contrast belongs under the
letters, not over everybody's face.

They also drift every shot inward at the same slow rate and hold it for four
seconds. `make-ad-20s.sh` moves about three times faster, alternates push
against pull so no two neighbouring shots travel the same way, and cuts the
beats hard on a white flash frame. If you rebuild the other two, both changes
are worth carrying across.

### If you edit the timeline

Work out the `xfade` offsets in frames and divide by 25, the way the header of
`make-ad-20s.sh` does. An offset a hundredth of a second past the end of its
clip does not fail - `ffmpeg` truncates the rest of the chain and still reports
success, which turned a 19-second assembly into a 7-second one with no error to
read.
