# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

COPY package*.json ./
COPY nest-cli.json ./
COPY tsconfig.json ./
COPY tsconfig.build.json ./

# Install dependencies (including devDependencies for build)
RUN npm ci

# Copy all source code (respects .dockerignore)
COPY . .

# Build the specific service
RUN npx nest build api-gateway

# Stage 2: Production
FROM node:20-alpine AS production

WORKDIR /usr/src/app

# Copy production dependencies (or we can just copy the built node_modules, 
# but for size optimization we could run npm ci --only=production, however monorepo structure makes this tricky.
# We will copy the node_modules from builder for simplicity as it includes shared workspace packages)
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY --from=builder /usr/src/app/dist ./dist

EXPOSE 3001

CMD ["node", "dist/apps/api-gateway/main"]
