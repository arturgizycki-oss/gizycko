#!/usr/bin/env bash
# Build a 20-second advertisement for gizycko.online from the site's own
# photographs. Output is 1920x1080 H.264, which is what YouTube and Google Ads
# want for a skippable in-stream spot.
set -euo pipefail

SRC="d:/work/for-artur/SaaS/my_add_files"
OUT="C:/Users/root/AppData/Local/Temp/claude/d--work-for-artur-SaaS/2b1d4a7d-2e79-419e-8b57-c65db1f09899/scratchpad/ad"
BOLD="C\\:/Windows/Fonts/arialbd.ttf"
REG="C\\:/Windows/Fonts/arial.ttf"

mkdir -p "$OUT"

# One scene: a photograph drifting slowly inward, dimmed, with a headline that
# fades in. The drift keeps a still image from looking like a slideshow.
scene () {
  local image="$1" out="$2" line1="$3" line2="$4" dim="$5"

  local second=""
  if [ -n "$line2" ]; then
    second=",drawtext=fontfile='${REG}':text='${line2}':fontcolor=white:fontsize=44:x=(w-text_w)/2:y=(h-text_h)/2+70:alpha='min(1,max(0,(t-0.5)*1.6))'"
  fi

  ffmpeg -y -loglevel error -loop 1 -i "$image" -t 4 \
    -vf "scale=1920:1080:force_original_aspect_ratio=increase,crop=1920:1080,\
zoompan=z='min(zoom+0.0008,1.10)':d=100:s=1920x1080:fps=25,\
drawbox=x=0:y=0:w=1920:h=1080:color=black@${dim}:t=fill,\
drawtext=fontfile='${BOLD}':text='${line1}':fontcolor=white:fontsize=92:x=(w-text_w)/2:y=(h-text_h)/2-40:alpha='min(1,t*1.6)'${second}" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$out"
}

scene "$SRC/landing page.png"   "$OUT/s1.mp4" "Talk to the world."       "Post, chat, and join groups"  "0.38"
scene "$SRC/friend page.png"    "$OUT/s2.mp4" "Post. Talk. Share."       "Every connection gets a private conversation" "0.42"
scene "$SRC/dashboard page.png" "$OUT/s3.mp4" "Share your life with it."   "Photos, songs, video, voice notes"     "0.42"
scene "$SRC/group page.png"     "$OUT/s4.mp4" "Groups worth joining."     "Find the people you actually get on with" "0.42"

# End card. White, not brand blue: the logo file is rgb24 with no alpha, so on
# any coloured ground it carries a visible white box. On white it simply sits
# there, which is what a logo should do.
ffmpeg -y -loglevel error -loop 1 -i "$SRC/logo.png" -t 5   -filter_complex "color=c=white:s=1920x1080:d=5:r=25[bg];[0:v]scale=240:240[logo];[bg][logo]overlay=x=(W-w)/2:y=(H/2)-260:shortest=1,drawtext=fontfile='${BOLD}':text='gizycko.online':fontcolor=0x1B7CF0:fontsize=108:x=(w-text_w)/2:y=(h-text_h)/2+40,drawtext=fontfile='${REG}':text='Talk to the world. Share your life with it.':fontcolor=0x3A4653:fontsize=44:x=(w-text_w)/2:y=(h-text_h)/2+180,drawtext=fontfile='${REG}':text='Free to join. 18+':fontcolor=0x8A94A0:fontsize=36:x=(w-text_w)/2:y=(h-text_h)/2+280,fade=t=in:st=0:d=0.4"   -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/s5.mp4"

# Crossfade the five together. Each clip is 4s (the end card 5s) and each
# transition eats 0.6s, so the offsets step 3.4s at a time.
ffmpeg -y -loglevel error \
  -i "$OUT/s1.mp4" -i "$OUT/s2.mp4" -i "$OUT/s3.mp4" -i "$OUT/s4.mp4" -i "$OUT/s5.mp4" \
  -filter_complex "\
[0][1]xfade=transition=fade:duration=0.6:offset=3.4[a];\
[a][2]xfade=transition=fade:duration=0.6:offset=6.8[b];\
[b][3]xfade=transition=fade:duration=0.6:offset=10.2[c];\
[c][4]xfade=transition=fade:duration=0.6:offset=13.6[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 25 \
  -movflags +faststart "$OUT/gizycko-ad-1080p.mp4"

echo "BUILT"
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height,codec_name \
  -of default=noprint_wrappers=1 "$OUT/gizycko-ad-1080p.mp4"
