FROM node:18

WORKDIR /app
COPY . .
RUN corepack enable && corepack prepare pnpm@latest --activate
RUN pnpm install
RUN pnpm nx build api

EXPOSE 3000
CMD ["node", "dist/api/main.js"]
