FROM node:20-bookworm-slim

WORKDIR /app/blockchain

COPY package*.json ./
RUN npm ci

COPY . .

EXPOSE 8545
