#!/usr/bin/env bash
# The 9:16 cut for Shorts and mobile feeds.
#
# Built from the source photographs rather than cropped from the finished
# 16:9 file: that version's headlines are laid out for a 1920-wide frame, so
# cropping to 1080 slices the words in half.
set -euo pipefail

SRC="d:/work/for-artur/SaaS/my_add_files"
OUT="C:/Users/root/AppData/Local/Temp/claude/d--work-for-artur-SaaS/2b1d4a7d-2e79-419e-8b57-c65db1f09899/scratchpad/ad"
BOLD="C\\:/Windows/Fonts/arialbd.ttf"
REG="C\\:/Windows/Fonts/arial.ttf"

# Type is smaller than the wide cut because the frame is 1080 across, not 1920.
scene () {
  local image="$1" out="$2" line1="$3" line2="$4" dim="$5"

  ffmpeg -y -loglevel error -loop 1 -i "$image" -t 4 \
    -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,\
zoompan=z='min(zoom+0.0008,1.10)':d=100:s=1080x1920:fps=25,\
drawbox=color=black@${dim}:t=fill,\
drawtext=fontfile='${BOLD}':text='${line1}':fontcolor=white:fontsize=68:x=(w-text_w)/2:y=(h-text_h)/2-40:alpha='min(1,t*1.6)',\
drawtext=fontfile='${REG}':text='${line2}':fontcolor=white:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2+50:alpha='min(1,max(0,(t-0.5)*1.6))'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$out"
}

scene "$SRC/landing page.png"   "$OUT/v1.mp4" "Talk to the world."     "Post, chat, and join groups"     "0.38"
scene "$SRC/friend page.png"    "$OUT/v2.mp4" "Post. Talk. Share."     "Every connection gets a private conversation"  "0.42"
scene "$SRC/dashboard page.png" "$OUT/v3.mp4" "Share your life with it." "Photos, songs, video, voice notes"        "0.42"
scene "$SRC/group page.png"     "$OUT/v4.mp4" "Groups worth joining."   "Find the people you actually get on with" "0.42"

ffmpeg -y -loglevel error -loop 1 -i "$SRC/logo.png" -t 5 \
  -filter_complex "color=c=white:s=1080x1920:d=5:r=25[bg];\
[0:v]scale=220:220[logo];\
[bg][logo]overlay=x=(W-w)/2:y=(H/2)-260:shortest=1,\
drawtext=fontfile='${BOLD}':text='gizycko.online':fontcolor=0x1B7CF0:fontsize=76:x=(w-text_w)/2:y=(h-text_h)/2,\
drawtext=fontfile='${REG}':text='Talk to the world.':fontcolor=0x3A4653:fontsize=38:x=(w-text_w)/2:y=(h-text_h)/2+110,\
drawtext=fontfile='${REG}':text='Share your life with it.':fontcolor=0x3A4653:fontsize=38:x=(w-text_w)/2:y=(h-text_h)/2+170,\
drawtext=fontfile='${REG}':text='Free to join. 18+':fontcolor=0x8A94A0:fontsize=32:x=(w-text_w)/2:y=(h-text_h)/2+270,\
fade=t=in:st=0:d=0.4" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/v5.mp4"

ffmpeg -y -loglevel error \
  -i "$OUT/v1.mp4" -i "$OUT/v2.mp4" -i "$OUT/v3.mp4" -i "$OUT/v4.mp4" -i "$OUT/v5.mp4" \
  -filter_complex "\
[0][1]xfade=transition=fade:duration=0.6:offset=3.4[a];\
[a][2]xfade=transition=fade:duration=0.6:offset=6.8[b];\
[b][3]xfade=transition=fade:duration=0.6:offset=10.2[c];\
[c][4]xfade=transition=fade:duration=0.6:offset=13.6[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 25 \
  -movflags +faststart "$OUT/gizycko-ad-vertical.mp4"

echo "BUILT VERTICAL"
