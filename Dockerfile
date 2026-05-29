FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
# copy prisma schema early so postinstall hooks (prisma generate) work
COPY prisma ./prisma
RUN npm install --legacy-peer-deps

COPY . .
RUN npx prisma generate && npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/public ./public
COPY --from=builder /app/prisma ./prisma

EXPOSE 3000
CMD ["node", "server.js"]
