# syntax=docker/dockerfile:1

FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --omit=optional && npm cache clean --force

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src

USER node
EXPOSE 7495

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:7495/health').then(r=>r.json().then(b=>process.exit(r.status===200&&b.status==='ok'?0:1))).catch(()=>process.exit(1))"

CMD ["node", "src/cli.js", "--mode", "remote", "--host", "0.0.0.0", "--port", "7495", "--cors", "*"]
