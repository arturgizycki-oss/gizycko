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
| `gizycko-ad-30s.mp4` | 1920x1080 | 28.4s | The long cut: in-stream, and the site's own pages |
| `gizycko-ad-7s.mp4` | 1920x1080 | 7.4s | The four beats and the mark, cut out of the long one |

## The GIFs

| File | Size | Length | Weight |
| --- | --- | --- | --- |
| `gizycko-ad-30s.gif` | 480x270 | 28.4s | 10.7 MB |
| `gizycko-ad-7s.gif` | 560x315 | 7.4s | 4.3 MB |

Ten megabytes is a lot for a GIF, and it is not carelessness: the photographs
drift continuously, so no two frames are alike and there is almost nothing for
the format to squeeze out. Width and frame rate are the only levers, and below
about 480 wide the second line of the proof captions stops being readable.

So if something refuses the long one - most chat apps stop around 8 MB - send
`gizycko-ad-7s.gif` rather than shrinking the other. It carries the four beats
and the address, which is the part that works without sound anyway.

Prefer the `.mp4` wherever it is accepted. It is smaller *and* better looking:
9.2 MB for the full film against 10.7 MB for a quarter-size GIF of it.

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
bash marketing/make-ad-30s.sh       # 16:9, 28.4s
bash marketing/make-gif.sh          # both GIFs, from gizycko-ad-30s.mp4
```

The three video scripts write into a temporary folder; copy the results back
into `marketing/`. `make-gif.sh` reads and writes `marketing/` directly, so run
it after the 30-second film is in place. Edit the `scene`, `beat` and `proof`
lines to change a headline or swap a photograph.

### A note on the grading

`make-ad-30s.sh` dims each photograph by 20% and gives the type its own drop
shadow. The earlier scripts dim by 45% with no shadow, which is enough to turn
a lake at golden hour into an overcast afternoon. If you rebuild those two, it
is worth carrying the change across: contrast belongs under the letters, not
over everybody's face.
