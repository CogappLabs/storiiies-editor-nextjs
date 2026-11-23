#!/usr/bin/env bash
# Creates a story through the editing API, edits it, and prints its links.
# Reads EDITOR_API_KEY from the environment or .env.local.
# Usage: scripts/api-smoke.sh [host]   (default https://iiif-annotation.vercel.app)
set -euo pipefail

host="${1:-https://iiif-annotation.vercel.app}"
if [[ -z "${EDITOR_API_KEY:-}" && -f .env.local ]]; then
  EDITOR_API_KEY=$(grep -E '^EDITOR_API_KEY=' .env.local | tail -1 | cut -d= -f2- | tr -d '"')
fi
: "${EDITOR_API_KEY:?Set EDITOR_API_KEY or add it to .env.local}"

api() {
  local method=$1 path=$2 body=${3:-}
  local args=(-sS -X "$method" -H "Authorization: Bearer $EDITOR_API_KEY" -w '\n%{http_code}')
  [[ -n "$body" ]] && args+=(-H "Content-Type: application/json" -d "$body")
  local out status
  out=$(curl "${args[@]}" "$host$path")
  status=${out##*$'\n'}
  out=${out%$'\n'*}
  >&2 echo "$method $path -> $status"
  if [[ $status -ge 400 ]]; then
    >&2 echo "$out"
    exit 1
  fi
  printf '%s' "$out"
}

info="https://storiiies-images.cogapp.com/iiif/2/1793637773002AP198108sRGBWeb.ptif/info.json"

>&2 echo "Creating story…"
story=$(api POST /api/v1/stories "{\"title\":\"[api test] $(date -u +%FT%TZ)\",\"infoJsonUrl\":\"$info\"}")
id=$(jq -r .id <<<"$story")

>&2 echo "Editing story…"
api PATCH "/api/v1/stories/$id" '{"author":"API smoke test","infoPosition":"bottom-right"}' >/dev/null

>&2 echo "Adding annotations…"
first=$(api POST "/api/v1/stories/$id/annotations" '{"text":"Added by the API","x":100,"y":100,"width":400,"height":300}' | jq -r .id)
api POST "/api/v1/stories/$id/annotations" '{"text":"Second annotation","x":600,"y":400,"width":300,"height":300}' >/dev/null

>&2 echo "Editing the first annotation…"
api PATCH "/api/v1/stories/$id/annotations/$first" '{"text":"Added by the API, then edited"}' >/dev/null

api GET "/api/v1/stories/$id" | jq '{title, author, infoPosition, annotations: [.annotations[] | {ordinal, text}]}'
echo "Editor:   $host/editor/$id"
echo "Preview:  $host/preview/storiiies/$id"
echo "Delete:   curl -X DELETE -H \"Authorization: Bearer \$EDITOR_API_KEY\" $host/api/v1/stories/$id"
