# ==========================================
# 1. Build Backend Stage
# ==========================================
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Install dependencies
COPY backend/package*.json ./
RUN npm ci

# Generate Prisma Client
COPY backend/prisma ./prisma
RUN npx prisma generate

# Build Backend
COPY backend/ ./
RUN npm run build

# ==========================================
# 2. Build Frontend Stage
# ==========================================
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend

# Install dependencies
COPY frontend/package*.json ./
RUN npm ci

# Build Frontend
COPY frontend/ ./
RUN npm run build

# ==========================================
# 3. Final Production Stage
# ==========================================
FROM node:20-alpine
WORKDIR /app

# Install PM2 globally to manage multiple processes
RUN npm install -g pm2

# Copy Backend Build & Dependencies
COPY --from=backend-builder /app/backend/package*.json ./backend/
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY --from=backend-builder /app/backend/dist ./backend/dist
COPY --from=backend-builder /app/backend/prisma ./backend/prisma

# Copy Frontend Build & Dependencies
COPY --from=frontend-builder /app/frontend/package*.json ./frontend/
COPY --from=frontend-builder /app/frontend/node_modules ./frontend/node_modules
COPY --from=frontend-builder /app/frontend/.next ./frontend/.next
COPY --from=frontend-builder /app/frontend/public ./frontend/public
COPY --from=frontend-builder /app/frontend/next.config.ts ./frontend/next.config.ts

# Copy PM2 ecosystem file
COPY ecosystem.config.js .

# Expose both ports (3000 for frontend, 5000 for backend)
EXPOSE 3000 5000

# Start both services using PM2
CMD ["pm2-runtime", "start", "ecosystem.config.js"]
