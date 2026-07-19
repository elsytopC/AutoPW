#!/usr/bin/env bash
set -euo pipefail

API="${CONDUIT_API_URL:-http://127.0.0.1:3000/api}"
UI="${CONDUIT_UI_URL:-http://127.0.0.1:4201}"

echo "Waiting for Conduit API at ${API}/tags ..."
echo "Waiting for Conduit UI at ${UI} ..."

for _ in $(seq 1 60); do
  if curl -fsS "${API}/tags" >/dev/null 2>&1 && curl -fsS "${UI}/" >/dev/null 2>&1; then
    echo "Conduit stack is ready."
    exit 0
  fi
  sleep 2
done

echo "Conduit stack did not become ready within 120s." >&2
exit 1
