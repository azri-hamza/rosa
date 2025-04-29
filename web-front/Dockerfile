# Build stage
FROM node:18 AS builder

WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install
RUN pnpm nx build web-front

# Serve using NGINX
FROM nginx:alpine
COPY --from=builder /app/dist/web-front /usr/share/nginx/html
EXPOSE 80
