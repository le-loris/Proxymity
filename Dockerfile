# -------- FRONTEND BUILD --------
FROM node:22-alpine AS frontend-builder
WORKDIR /app/frontend
COPY app/frontend/package*.json ./
RUN npm install
COPY app/frontend/ ./
RUN npm run build

# -------- BACKEND BUILD --------
FROM node:22-alpine
WORKDIR /app

# Install backend dependencies
COPY app/backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm install

# Copy backend source
COPY app/backend/ /app/backend/

# Copy frontend build output to /app/frontend/dist
COPY --from=frontend-builder /app/frontend/dist /app/frontend/dist

EXPOSE 3000
WORKDIR /app/backend
CMD ["node", "index.js"]
