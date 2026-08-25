#!/usr/bin/env bash
# The main spot for gizycko.online: 19.4 seconds, cut for pace.
#
# The previous version drifted: every shot pushed in at the same slow rate, held
# for four seconds, and dissolved into the next one doing the same thing. Nine
# shots of that reads as a screensaver however good the photographs are.
#
# What changes here:
#
#   moves   about three times faster, and no two adjacent shots move the same
#           way. A push answered by a pull-back, a drift left answered by a
#           drift right. Direction is what the eye notices; speed alone just
#           looks like a mistake.
#   cuts    hard, on the beats, with a white flash on the frame after the cut.
#           A dissolve says "and then". A flash cut says "and".
#   type    arrives. It overshoots by sixty pixels and settles in an eighth of
#           a second, instead of fading up over half of one.
#   shape   five one-word beats instead of four, and the proof section trimmed
#           from four seconds a shot to two and a half. Same words, less waiting.
#
# The grade is unchanged from the previous cut: a fifth of a stop of dim and a
# drop shadow under the type, so the lake keeps its colour.
set -euo pipefail

SRC="d:/work/for-artur/SaaS/my_add_files"
OUT="C:/Users/root/AppData/Local/Temp/claude/d--work-for-artur-SaaS/2b1d4a7d-2e79-419e-8b57-c65db1f09899/scratchpad/ad20"
BOLD="C\\:/Windows/Fonts/arialbd.ttf"
REG="C\\:/Windows/Fonts/arial.ttf"
BLUE="0x1B7CF0"

mkdir -p "$OUT"

BARS="drawbox=x=0:y=0:w=1920:h=100:color=black:t=fill,drawbox=x=0:y=980:w=1920:h=100:color=black:t=fill"
WASH="drawbox=color=black@0.20:t=fill"
GRADE="eq=saturation=1.12:contrast=1.04"
SHADOW="shadowcolor=black@0.75:shadowx=3:shadowy=3"
FILL="scale=1920:1080:force_original_aspect_ratio=increase:flags=lanczos,crop=1920:1080"

# The flash. Starting a shot on white for four frames reads as an impact rather
# than a transition, which is the whole trick behind a cut-to-music promo.
FLASH="fade=t=in:st=0:d=0.10:color=white"

# --- hook: black, two lines, the second landing hard ------------------------
ffmpeg -y -loglevel error -f lavfi -i "color=c=black:s=1920x1080:d=2.8:r=25" -frames:v 70 \
  -vf "drawtext=fontfile='${BOLD}':text='Everyone is nearby.':fontcolor=white:fontsize=88:x=(w-text_w)/2:y='(h-text_h)/2-70 + 50*max(0,1-(t-0.15)*10)':alpha='min(1,max(0,(t-0.15)*8))',\
drawtext=fontfile='${BOLD}':text='Nobody is close.':fontcolor=${BLUE}:fontsize=88:x=(w-text_w)/2:y='(h-text_h)/2+50 + 50*max(0,1-(t-1.05)*10)':alpha='min(1,max(0,(t-1.05)*8))'" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/a1.mp4"

# --- turn: the promise, on a hard push in -----------------------------------
ffmpeg -y -loglevel error -loop 1 -i "$SRC/login_background.png" -frames:v 65 \
  -vf "${FILL},${GRADE},\
zoompan=z='min(1+0.0026*on,1.17)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=65:s=1920x1080:fps=25,\
${WASH},${BARS},\
drawtext=fontfile='${BOLD}':text='So we built somewhere to start.':fontcolor=white:fontsize=76:x=(w-text_w)/2:y='(h-text_h)/2 + 50*max(0,1-t*10)':${SHADOW}:alpha='min(1,t*8)'" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/a2.mp4"

# --- rhythm: one word a beat, alternating direction -------------------------
# move=in pushes in, move=out starts wide and falls back. Cutting one against
# the other is what stops five shots in four seconds turning into a blur.
beat () {
  local image="$1" crop="$2" out="$3" word="$4" move="$5"
  local z

  if [ "$move" = "in" ]; then
    z="min(1+0.0072*on,1.16)"
  else
    z="max(1.16-0.0072*on,1.0)"
  fi

  ffmpeg -y -loglevel error -loop 1 -i "$image" -frames:v 21 \
    -vf "crop=${crop},${FILL},${GRADE},\
zoompan=z='${z}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=21:s=1920x1080:fps=25,\
${WASH},${BARS},${FLASH},\
drawtext=fontfile='${BOLD}':text='${word}':fontcolor=white:fontsize=150:x=(w-text_w)/2:y='(h-text_h)/2 + 60*max(0,1-t*12)':${SHADOW}:alpha='min(1,t*12)'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$out"
}

beat "$SRC/friend_background.png"    "836:470:0:0"      "$OUT/b1.mp4" "MATCH." in
beat "$SRC/friend_background.png"    "836:470:836:0"    "$OUT/b2.mp4" "TALK."  out
beat "$SRC/friend_background.png"    "836:470:0:470"    "$OUT/b3.mp4" "MEET."  in
beat "$SRC/dashboard_background.png" "1254:705:0:118"   "$OUT/b4.mp4" "SHARE." out
beat "$SRC/friend_background.png"    "836:470:836:470"  "$OUT/b5.mp4" "STAY."  in

# --- proof: what it actually does, still moving ------------------------------
# The type slides in from the left while the frame drifts right, so the two are
# never travelling together. Held two and a half seconds, not four.
proof () {
  local image="$1" out="$2" line1="$3" line2="$4" dir="$5"
  local x

  if [ "$dir" = "right" ]; then
    x="(iw-iw/zoom)*min(1,on/63)"
  else
    x="(iw-iw/zoom)*(1-min(1,on/63))"
  fi

  ffmpeg -y -loglevel error -loop 1 -i "$image" -frames:v 63 \
    -vf "${FILL},${GRADE},\
zoompan=z='min(1+0.0022*on,1.14)':x='${x}':y='ih/2-(ih/zoom/2)':d=63:s=1920x1080:fps=25,\
${WASH},${BARS},\
drawtext=fontfile='${BOLD}':text='${line1}':fontcolor=white:fontsize=64:x='(w-text_w)/2 - 70*max(0,1-t*9)':y=(h-text_h)/2-30:${SHADOW}:alpha='min(1,t*9)',\
drawtext=fontfile='${REG}':text='${line2}':fontcolor=white:fontsize=40:x='(w-text_w)/2 - 70*max(0,1-(t-0.22)*9)':y=(h-text_h)/2+60:${SHADOW}:alpha='min(1,max(0,(t-0.22)*9))'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$out"
}

proof "$SRC/landing_background.png"   "$OUT/c1.mp4" "Every match gets a private conversation." "No paywall to reply."                       right
proof "$SRC/dashboard_background.png" "$OUT/c2.mp4" "Share photos, songs, video, voice notes." "The bits of your day worth telling someone." left
proof "$SRC/group_background.png"     "$OUT/c3.mp4" "Groups worth joining."                    "Find the people you actually get on with."   right

# --- close: the mark lands, then the address --------------------------------
ffmpeg -y -loglevel error -loop 1 -i "$SRC/logo.png" -frames:v 90 \
  -filter_complex "color=c=white:s=1920x1080:d=3.6:r=25[bg];\
[0:v]scale=260:260[logo];\
[bg][logo]overlay=x=(W-w)/2:y='(H/2)-250 + 40*max(0,1-t*10)':shortest=1,\
drawtext=fontfile='${BOLD}':text='gizycko.online':fontcolor=${BLUE}:fontsize=110:x=(w-text_w)/2:y='(h-text_h)/2+50 + 40*max(0,1-(t-0.18)*10)':alpha='min(1,max(0,(t-0.18)*8))',\
drawtext=fontfile='${REG}':text='Meet people nearby. Stay for the community.':fontcolor=0x3A4653:fontsize=42:x=(w-text_w)/2:y=(h-text_h)/2+190:alpha='min(1,max(0,(t-0.5)*8))',\
drawtext=fontfile='${REG}':text='Free to join. 18+':fontcolor=0x8A94A0:fontsize=34:x=(w-text_w)/2:y=(h-text_h)/2+280:alpha='min(1,max(0,(t-0.75)*8))',\
fade=t=in:st=0:d=0.12:color=white" \
  -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p -r 25 "$OUT/d1.mp4"

# --- assemble ---------------------------------------------------------------
# Short dissolves around the slow sections; the beats butt straight up against
# each other and rely on their own flash frames to separate.
ffmpeg -y -loglevel error \
  -i "$OUT/a1.mp4" -i "$OUT/a2.mp4" \
  -i "$OUT/b1.mp4" -i "$OUT/b2.mp4" -i "$OUT/b3.mp4" -i "$OUT/b4.mp4" -i "$OUT/b5.mp4" \
  -i "$OUT/c1.mp4" -i "$OUT/c2.mp4" -i "$OUT/c3.mp4" -i "$OUT/d1.mp4" \
  -filter_complex "\
[0][1]xfade=transition=fade:duration=0.24:offset=2.56[x1];[x1][2]xfade=transition=fade:duration=0.12:offset=5.04[x2];[x2][3]xfade=transition=fade:duration=0.04:offset=5.84[x3];[x3][4]xfade=transition=fade:duration=0.04:offset=6.64[x4];[x4][5]xfade=transition=fade:duration=0.04:offset=7.44[x5];[x5][6]xfade=transition=fade:duration=0.04:offset=8.24[x6];[x6][7]xfade=transition=fade:duration=0.16:offset=8.92[x7];[x7][8]xfade=transition=slideleft:duration=0.2:offset=11.24[x8];[x8][9]xfade=transition=slideleft:duration=0.2:offset=13.56[x9];[x9][10]xfade=transition=fade:duration=0.28:offset=15.8[v]" \
  -map "[v]" -c:v libx264 -preset slow -crf 19 -pix_fmt yuv420p -r 25 \
  -movflags +faststart "$OUT/gizycko-ad-20s.mp4"

echo "BUILT"
ffprobe -v error -show_entries format=duration,size -show_entries stream=width,height -of csv=p=0 "$OUT/gizycko-ad-20s.mp4"
