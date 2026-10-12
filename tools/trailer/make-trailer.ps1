# Cuts the arcade trailer from clips the games record themselves. Put the .avi clips beside this script (see
# docs/proposals/showing-the-games.md "A trailer" for the recording commands and flags), then run it. Needs ffmpeg
# (C:\Users\evanb\Tools\ffmpeg-9.0.2-essentials_build). Music: Ninja Adventure "1 - Adventure Begin" (CC0).
$ErrorActionPreference = 'Stop'
$ff = "C:\Users\evanb\Tools\ffmpeg-9.0.2-essentials_build\bin\ffmpeg.exe"
$sp = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $sp
$font = "C\:/Windows/Fonts/segoeuib.ttf"
$font2 = "C\:/Windows/Fonts/segoeui.ttf"
$W = 1536; $H = 864
function Cap($t) { if ($t -eq "") { return "" } ; return ",drawtext=fontfile='$font':text='$t':fontsize=46:fontcolor=white:x=(w-text_w)/2:y=60:box=1:boxcolor=0x111626@0.72:boxborderw=22" }
function Clip($name, $src, $ss, $d, $cap) {
  $fo = $d - 0.35
  & $ff -y -loglevel error -ss $ss -t $d -i "$src.avi" -vf ("fps=30,format=yuv420p,fade=t=in:st=0:d=0.3,fade=t=out:st=$($fo):d=0.35" + (Cap $cap)) -an -c:v libx264 -preset medium -crf 18 "$name.mp4"
}
function Card($name, $d, $big, $small, $small2) {
  $vf = "drawtext=fontfile='$font':text='$big':fontsize=120:fontcolor=0xffd575:x=(w-text_w)/2:y=(h/2)-130"
  if ($small -ne "") { $vf += ",drawtext=fontfile='$font2':text='$small':fontsize=46:fontcolor=white:x=(w-text_w)/2:y=(h/2)+30" }
  if ($small2 -ne "") { $vf += ",drawtext=fontfile='$font2':text='$small2':fontsize=34:fontcolor=0xa6ead0:x=(w-text_w)/2:y=(h/2)+110" }
  $vf += ",fade=t=in:st=0:d=0.4,fade=t=out:st=$($d - 0.4):d=0.4,format=yuv420p"
  & $ff -y -loglevel error -f lavfi -i "color=c=0x111626:s=$($W)x$($H):d=$($d):r=30" -vf $vf -an -c:v libx264 -preset medium -crf 18 "$name.mp4"
}
Card c0 2.2 "IDLE ARCADE" "presents" ""
Card c1 2.8 "WILDBOND" "a creature-bonding adventure" ""
Clip s01 demo 1.0 3.6 "The valley has lost its colour."
Clip s02 demo 8.6 3.0 "Sign the ranch register. Become a tamer."
Clip s03 demo 33.8 6.2 "Choose a partner. Trust brings the colour back."
Clip s04 demo 44.0 2.8 ""
Clip s05 demo 57.0 5.0 "Battle tamers and wild creatures."
Clip s06 demo 90.5 3.0 "Explore every area on foot."
Clip s07 lark 1.0 2.6 "Restore the valley, area by area."
Clip s08 coast 1.0 2.4 ""
Clip s09 ember 1.0 2.4 ""
Clip s10 pass 1.0 2.4 ""
Clip s11 nursery 3.4 3.0 "Raise, breed and gear your team."
Clip s12 bench 3.6 2.8 ""
Card c2 2.4 "STARFALL" "grow a frontier guild town" ""
Clip s13 starfall 1.0 4.6 "Post jobs. Serve stew. Work the forge."
Card c3 5.0 "COME PLAY" "Free in your browser. No sign-up." "ecbarish.github.io/generations/playtest.html"
$list = "c0","c1","s01","s02","s03","s04","s05","s06","s07","s08","s09","s10","s11","s12","c2","s13","c3"
($list | ForEach-Object { "file '$_.mp4'" }) | Set-Content -Encoding ascii list.txt
& $ff -y -loglevel error -f concat -safe 0 -i list.txt -c copy video.mp4
$dur = [double](& "$(Split-Path $ff)\ffprobe.exe" -v error -show_entries format=duration -of csv=p=0 video.mp4)
$music = "C:\Users\evanb\Godot\NinjaAdventure\Ninja Adventure - Asset Pack\Audio\Musics\1 - Adventure Begin.ogg"
& $ff -y -loglevel error -i video.mp4 -i $music -filter_complex "[1:a]atrim=0:$dur,afade=t=in:st=0:d=0.5,afade=t=out:st=$($dur-2.5):d=2.5,volume=0.8[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 160k -shortest -movflags +faststart trailer.mp4
"duration $dur"
