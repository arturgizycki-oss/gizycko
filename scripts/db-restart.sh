#!/usr/bin/env bash
# Bring the local `prisma dev` database back after it stops answering.
#
# It fails in two ways, neither of which says so plainly:
#
#   1. The server stops accepting connections while still holding its ports.
#      Queries come back "Server has closed the connection", which reads like
#      the data is gone. It is not - nothing here touches the data.
#
#   2. A killed server leaves a lock behind, so the next start says "Skipped!
#      already running" and exits, while nothing is actually listening.
#
# It also picks new ports on most restarts, and a stale DATABASE_URL in .env
# then produces the same error as (1). This rewrites both URLs to match.
set -euo pipefail

cd "$(dirname "$0")/.."

STATE="${LOCALAPPDATA:-$HOME/.local/share}/prisma-dev-nodejs/Data"
LOG="${TMPDIR:-/tmp}/prisma-dev-restart.log"

echo "Stopping any running server..."
if command -v powershell.exe >/dev/null 2>&1; then
  powershell.exe -NoProfile -Command "
    Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" |
      Where-Object { \$_.CommandLine -like '*prisma*dev*' } |
      ForEach-Object { Stop-Process -Id \$_.ProcessId -Force }
  " >/dev/null 2>&1 || true
else
  pkill -f "prisma.*dev" 2>/dev/null || true
fi
sleep 2

echo "Clearing stale locks..."
rm -rf "$STATE"/*/.lock "$STATE"/durable-streams/*/server.lock.lock 2>/dev/null || true

echo "Starting..."
(npx prisma dev > "$LOG" 2>&1 &)

for _ in $(seq 1 30); do
  if grep -q "DATABASE_URL=" "$LOG" 2>/dev/null; then break; fi
  sleep 2
done

# Strip the colour codes before reading the URLs back out.
plain=$(sed 's/\x1b\[[0-9;]*m//g' "$LOG")

for name in DATABASE_URL SHADOW_DATABASE_URL; do
  url=$(printf '%s\n' "$plain" | grep -oE "${name}=\"postgres://[^\"]+\"" | head -1 | cut -d'"' -f2)

  if [ -z "$url" ]; then
    echo "Could not read $name. The log is at $LOG" >&2
    exit 1
  fi

  port=$(printf '%s\n' "$url" | grep -oE "localhost:[0-9]+" | cut -d: -f2)

  # Python, not sed or perl: the URL carries @ and & and ?, and perl in
  # particular reads "@localhost" as an array and quietly drops it, leaving
  # a connection string wrong in a way the error message does not explain.
  NAME="$name" URL="$url" python -c "
import os, pathlib, re
name, url = os.environ['NAME'], os.environ['URL']
env = pathlib.Path('.env')
text = env.read_text(encoding='utf-8')
line = name + '=' + chr(34) + url + chr(34)
text, n = re.subn('^' + re.escape(name) + '=.*$', lambda m: line, text, count=1, flags=re.M)
env.write_text(text if n else text.rstrip() + chr(10) + line + chr(10), encoding='utf-8')
"
  echo "  $name -> port $port"
done

echo "Applying migrations..."
npx prisma migrate deploy >/dev/null

echo "Ready. Run 'npx vitest run' to check."
