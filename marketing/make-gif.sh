#!/usr/bin/env bash
# Turn the finished spots into GIFs.
#
# Two passes, not one. A GIF holds 256 colours, and letting ffmpeg pick them
# frame by frame makes the lake band into stripes; palettegen reads the whole
# film first and chooses one set for all of it.
#
# On size, which is the whole difficulty here. Every frame of this advert
# differs from the last, because the photographs drift the entire time, so
# there is almost nothing for the format to compress away. That leaves width
# and frame rate as the only real controls, and both of them cost legibility:
# under about 480 wide the second line of the proof captions stops being
# readable, which is the point at which a smaller file is no longer worth
# having. Hence 480 for the full cut, and a shorter one for anywhere with a
# strict limit.
set -euo pipefail

MARKETING="$(cd "$(dirname "$0")" && pwd)"
WORK="${TMPDIR:-/tmp}/gizycko-gif"
mkdir -p "$WORK"

# gif <source.mp4> <out.gif> <width> <fps> <colours>
gif () {
  local src="$1" out="$2" width="$3" fps="$4" colors="$5"
  local palette="$WORK/palette-$(basename "$out" .gif).png"

  ffmpeg -y -loglevel error -i "$src" \
    -vf "fps=${fps},scale=${width}:-1:flags=lanczos,palettegen=max_colors=${colors}:stats_mode=diff" \
    "$palette"

  # bayer rather than the default error-diffusion: it dithers each frame the
  # same way, so a flat sky does not crawl with noise from one frame to the next.
  ffmpeg -y -loglevel error -i "$src" -i "$palette" \
    -lavfi "fps=${fps},scale=${width}:-1:flags=lanczos[v];[v][1:v]paletteuse=dither=bayer:bayer_scale=4:diff_mode=rectangle" \
    "$out"

  printf "%-26s %6.1f MB\n" "$(basename "$out")" \
    "$(stat -c %s "$out" | awk '{print $1/1048576}')"
}

# The four beats, then the mark: the part that works without sound, without
# context, and at a size a messaging app will accept.
ffmpeg -y -loglevel error -i "$MARKETING/gizycko-ad-30s.mp4" -filter_complex \
  "[0:v]trim=8.35:12.75,setpts=PTS-STARTPTS[a];\
[0:v]trim=24.2:27.2,setpts=PTS-STARTPTS[b];\
[a][b]concat=n=2:v=1[v]" \
  -map "[v]" -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 \
  -movflags +faststart "$MARKETING/gizycko-ad-7s.mp4"

gif "$MARKETING/gizycko-ad-30s.mp4" "$MARKETING/gizycko-ad-30s.gif" 480 10 128
gif "$MARKETING/gizycko-ad-7s.mp4"  "$MARKETING/gizycko-ad-7s.gif"  560 12 160
