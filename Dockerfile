# syntax=docker/dockerfile:1

FROM denoland/deno:alpine-2.9.3 AS deps
WORKDIR /app

COPY package.json package-lock.json deno.json deno.lock ./
COPY src ./src

# --frozen fails the build if deno.lock drifts from package.json; deno cache
# precompiles the module graph so runtime startup needs no package downloads.
RUN deno install --frozen && deno cache src/deno-deploy.js

# Mirrors the Deno Deploy entrypoint so self-hosted containers stay
# behaviorally identical to the public https://youtube-transcript-mcp.deno.dev.
FROM denoland/deno:alpine-2.9.3 AS runtime
WORKDIR /app

COPY --from=deps /app /app
COPY --from=deps /deno-dir /deno-dir
COPY static ./static
RUN chown -R deno:deno /deno-dir

USER deno
EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O- http://127.0.0.1:8000/health | grep -q '"status":"ok"' || exit 1

CMD ["deno", "run", "--allow-net", "--allow-env", "--allow-read", "--cached-only", "src/deno-deploy.js"]
