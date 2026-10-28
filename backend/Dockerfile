# Stage 1: Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Dependency files copy karein
COPY package*.json ./
COPY prisma ./prisma/

# Dependencies install karein aur Prisma generate karein
RUN npm ci
RUN npx prisma generate

# Source code copy karein aur build karein
COPY tsconfig.json ./
COPY src ./src
RUN npm run build

# Stage 2: Production Runner stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Sirf production dependencies install karein
COPY package*.json ./
RUN npm ci --only=production

# Builder stage se generated prisma client aur compiled dist copy karein
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/prisma ./prisma
COPY tsconfig.json ./
COPY prisma.config.ts ./
COPY --from=builder /app/dist ./dist

# Port expose karein
EXPOSE 5001

# Application start karein
CMD ["node", "dist/server.js"]
