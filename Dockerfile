# Multi-stage Dockerfile for HOME BASED ELECTRONICS, ELECTRICAL AND REFRIGERATION SERVICES

# Stage 1: Build the React SPA
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package descriptors
COPY package*.json ./

# Install dependencies cleanly
RUN npm ci || npm install

# Copy source code and config files
COPY . .

# Build production bundle to /app/dist
RUN npm run build

# Stage 2: Production Nginx Server
FROM nginx:alpine

# Copy built static files to Nginx public html directory
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy custom Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port 3000
EXPOSE 3000

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
