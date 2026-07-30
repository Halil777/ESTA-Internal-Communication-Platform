FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY vendor ./vendor
RUN npm ci
COPY . .
RUN npm run build

FROM node:22-alpine AS production
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY vendor ./vendor
RUN npm ci --omit=dev \
  && mkdir -p node_modules/typeorm/node_modules/minimatch/vendor \
  && cp -R vendor/brace-expansion node_modules/typeorm/node_modules/minimatch/vendor/brace-expansion \
  && npm cache clean --force
COPY --from=builder /app/dist ./dist
EXPOSE 3001
CMD ["sh", "-c", "node dist/database/seed.js && node dist/main.js"]
