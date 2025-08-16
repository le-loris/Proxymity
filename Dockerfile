# -------- FRONTEND --------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY app/frontend/ .
# Installation de MUI, react-simple-code-editor et prismjs avant le build
RUN npm install @mui/material @emotion/react @emotion/styled @mui/icons-material react-simple-code-editor prismjs react-router-dom && npm install && npm run build

# -------- BACKEND --------
FROM node:20-alpine

WORKDIR /app

# Installe docker-cli (et bash si tu veux faire des scripts)
RUN apk add --no-cache docker-cli bash

# Backend install
COPY app/backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install
COPY app/backend/ .
# Install backend dependencies declared in app/backend/package.json (includes archiver and dockerode)
RUN npm install

# Frontend build copié dans /public
COPY --from=frontend-builder /app/frontend/dist ./public

EXPOSE 3000
CMD ["node", "index.js"]
