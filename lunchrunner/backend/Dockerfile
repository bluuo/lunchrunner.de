# syntax=docker/dockerfile:1
FROM node:18-slim AS base
WORKDIR /usr/src/app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs nodeapp

COPY package.json package-lock.json* ./
RUN npm ci --only=production && npm cache clean --force

COPY src ./src

USER nodeapp
EXPOSE 3000
CMD ["node", "src/server.js"]
