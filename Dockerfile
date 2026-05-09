# Stage 1: Build the Vite app
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Production Node server (Express + Gemini proxy)
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Copy only production deps
COPY package*.json ./
RUN npm ci --omit=dev

# Copy built app and server
COPY --from=builder /app/dist ./dist
COPY server.mjs ai-utils.mjs ./

EXPOSE 8080
CMD ["node", "server.mjs"]
