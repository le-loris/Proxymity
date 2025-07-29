# -------- FRONTEND --------
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend
COPY app/frontend/ .
# Installation de MUI et dépendances avant le build
RUN npm install @mui/material @emotion/react @emotion/styled @mui/icons-material && npm install && npm run build

# -------- BACKEND --------
FROM node:20-alpine

WORKDIR /app
COPY app/backend/ .
RUN npm install

# Copy frontend build to backend public folder
COPY --from=frontend-builder /app/frontend/dist /app/public

EXPOSE 3000
CMD ["node", "index.js"]