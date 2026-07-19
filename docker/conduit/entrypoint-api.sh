#!/bin/sh
set -e

mkdir -p /data
export DATABASE_URL="${DATABASE_URL:-file:/data/conduit.db}"

cd /app
bun x prisma db push

exec bun .output/server/index.mjs
