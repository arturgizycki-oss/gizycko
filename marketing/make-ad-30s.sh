#!/usr/bin/env bash
# A 30-second spot for gizycko.online.
#
# Shape, rather than a slideshow with captions:
#
#   hook    a contrarian line on black, the way Hinge sells itself by naming
#           the problem before the product
#   turn    the promise, once the problem has landed
#   rhythm  four one-word beats, cut fast - Nike's trick for building energy
#           out of very little footage
#   proof   slower, longer lines, what the thing actually does
#   close   logo, address, the terms a dating advert has to carry anyway
#
# Two things this gets right that the first attempt did not.
#
# The photographs keep their colour. Making white type readable by washing the
# whole frame with 45% black turned a lake at golden hour into an overcast car
# park, which is the wrong feeling to sell a dating site on. The wash is down to
# a fifth and the type carries its own drop shadow, which is what buys the
# contrast now - locally, under the letters, instead of over everyone's face.
#
# The four beats are cut from the four separate photographs inside
# friend_background rather than from the whole sheet. Used whole, its seams read
# on screen as a grid, and a visible grid is the one thing that says slideshow.
set -euo pipefail

SRC="d:/work/for-artur/SaaS/my_add_files"
OUT="C:/Users/root/AppData/Local/Temp/claude/d--work-for-artur-SaaS/2b1d4a7d-2e79-419e-8b57-c65db1f09899/scratchpad/ad30"
BOLD="C\\:/Windows/Fonts/arialbd.ttf"
REG="C\\:/Windows/Fonts/arial.ttf"
BLUE="0x1B7CF0"

mkdir -p "$OUT"

# Cinema bars. Nothing signals "this was made on purpose" faster, and they
# give the type a clean band to sit in.
BARS="drawbox=x=0:y=0:w=1920:h=100:color=black:t=fill,drawbox=x=0:y=980:w=1920:h=100:color=black:t=fill"

# Enough to seat white type, not enough to drain the photograph.
WASH="drawbox=color=black@0.20:t=fill"
GRADE="eq=saturation=1.10:contrast=1.03"
SHADOW="shadowcolor=black@0.75:shadowx=3:shadowy=3"

# Ken Burns, held on the middle of the frame. Left to itself zoompan walks
# towards the top-left corner, which drifts off whoever the shot is of.
kb () {  # kb <per-frame step> <ceiling> <frames>
  echo "zoompan=z='min(zoom+$1,$2)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=$3:s=1920x1080:fps=25"
}

FILL="scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080"

# --- hook: black, two lines, the second landing after the first --------------
ffmpeg -y -loglevel error -f lavfi -i "color=c=black:s=1920x1080:d=4:r=25" \
  -vf "drawtext=fontfile='${BOLD}':text='Everyone is nearby.':fontcolor=white:fontsize=88:x=(w-text_w)/2:y=(h-text_h)/2-70:alpha='min(1,max(0,(t-0.2)*3))',\
drawtext=fontfile='${BOLD}':text='Nobody is close.':fontcolor=${BLUE}:fontsize=88:x=(w-text_w)/2:y=(h-text_h)/2+50:alpha='min(1,max(0,(t-1.6)*3))'" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/a1.mp4"

# --- turn: the promise, over the one unbroken photograph --------------------
ffmpeg -y -loglevel error -loop 1 -i "$SRC/login_background.png" -t 4 \
  -vf "${FILL},${GRADE},$(kb 0.0009 1.12 100),${WASH},${BARS},\
drawtext=fontfile='${BOLD}':text='So we built somewhere to start.':fontcolor=white:fontsize=76:x=(w-text_w)/2:y=(h-text_h)/2:${SHADOW}:alpha='min(1,t*2)'" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/a2.mp4"

# --- rhythm: one word a beat, sliding up into place -------------------------
# The slide decays over the first quarter second, so the word arrives rather
# than simply appearing. Four of these cut together carry the middle.
#
# Each takes one quadrant of the 1672x941 contact sheet: 836x470, which is 16:9
# to within a pixel, so nothing is squeezed on the way up to full frame.
beat () {
  local image="$1" crop="$2" out="$3" word="$4"
  ffmpeg -y -loglevel error -loop 1 -i "$image" -t 1.6 \
    -vf "crop=${crop},${FILL},${GRADE},$(kb 0.002 1.10 40),${WASH},${BARS},\
drawtext=fontfile='${BOLD}':text='${word}':fontcolor=white:fontsize=140:x=(w-text_w)/2:y='(h-text_h)/2 + 40*max(0,1-t*5)':${SHADOW}:alpha='min(1,t*5)'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$out"
}

beat "$SRC/friend_background.png" "836:470:0:0"     "$OUT/b1.mp4" "MATCH."
beat "$SRC/friend_background.png" "836:470:836:0"   "$OUT/b2.mp4" "TALK."
beat "$SRC/friend_background.png" "836:470:0:470"   "$OUT/b3.mp4" "MEET."
beat "$SRC/friend_background.png" "836:470:836:470" "$OUT/b4.mp4" "STAY."

# --- proof: what it actually does, given room to breathe --------------------
proof () {
  local image="$1" out="$2" line1="$3" line2="$4"
  ffmpeg -y -loglevel error -loop 1 -i "$image" -t 4 \
    -vf "${FILL},${GRADE},$(kb 0.0008 1.10 100),${WASH},${BARS},\
drawtext=fontfile='${BOLD}':text='${line1}':fontcolor=white:fontsize=64:x=(w-text_w)/2:y=(h-text_h)/2-30:${SHADOW}:alpha='min(1,t*2)',\
drawtext=fontfile='${REG}':text='${line2}':fontcolor=white:fontsize=40:x=(w-text_w)/2:y=(h-text_h)/2+60:${SHADOW}:alpha='min(1,max(0,(t-0.4)*2))'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$out"
}

proof "$SRC/landing_background.png"   "$OUT/c1.mp4" "Every match gets a private conversation." "No paywall to reply."
proof "$SRC/dashboard_background.png" "$OUT/c2.mp4" "Share photos, songs, video, voice notes." "The bits of your day worth telling someone."
proof "$SRC/group_background.png"     "$OUT/c3.mp4" "Groups worth joining."                    "Find the people you actually get on with."

# --- close: the mark grows in, then the address -----------------------------
ffmpeg -y -loglevel error -loop 1 -i "$SRC/logo.png" -t 5 \
  -filter_complex "color=c=white:s=1920x1080:d=5:r=25[bg];\
[0:v]scale=260:260[logo];\
[bg][logo]overlay=x=(W-w)/2:y=(H/2)-250:shortest=1,\
drawtext=fontfile='${BOLD}':text='gizycko.online':fontcolor=${BLUE}:fontsize=110:x=(w-text_w)/2:y=(h-text_h)/2+50:alpha='min(1,max(0,(t-0.3)*2.5))',\
drawtext=fontfile='${REG}':text='Meet people nearby. Stay for the community.':fontcolor=0x3A4653:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2+190:alpha='min(1,max(0,(t-0.8)*2.5))',\
drawtext=fontfile='${REG}':text='Free to join. 18+':fontcolor=0x8A94A0:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2+280:alpha='min(1,max(0,(t-1.2)*2.5))',\
fade=t=in:st=0:d=0.3" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/d1.mp4"

# --- assemble ---------------------------------------------------------------
# Long dissolves around the slow sections, hard cuts between the fast beats.
# Cross-fading the rhythm would blunt exactly the thing it is there for.
ffmpeg -y -loglevel error \
  -i "$OUT/a1.mp4" -i "$OUT/a2.mp4" \
  -i "$OUT/b1.mp4" -i "$OUT/b2.mp4" -i "$OUT/b3.mp4" -i "$OUT/b4.mp4" \
  -i "$OUT/c1.mp4" -i "$OUT/c2.mp4" -i "$OUT/c3.mp4" -i "$OUT/d1.mp4" \
  -filter_complex "\
[0][1]xfade=transition=fade:duration=0.5:offset=3.5[x1];\
[x1][2]xfade=transition=fade:duration=0.4:offset=7.0[x2];\
[x2][3]xfade=transition=fade:duration=0.12:offset=8.5[x3];\
[x3][4]xfade=transition=fade:duration=0.12:offset=9.98[x4];\
[x4][5]xfade=transition=fade:duration=0.12:offset=11.46[x5];\
[x5][6]xfade=transition=fade:duration=0.45:offset=12.7[x6];\
[x6][7]xfade=transition=fade:duration=0.45:offset=16.25[x7];\
[x7][8]xfade=transition=fade:duration=0.45:offset=19.8[x8];\
[x8][9]xfade=transition=fade:duration=0.6:offset=23.35[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 25 \
  -movflags +faststart "$OUT/gizycko-ad-30s.mp4"

echo "BUILT"
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height -of csv=p=0 "$OUT/gizycko-ad-30s.mp4"
