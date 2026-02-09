# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy source and build
COPY . .

# Build args for Vite env (set at build time or in docker-compose)
ARG VITE_API_URL=/api/v1
ARG VITE_GOOGLE_MAPS_API_KEY
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_GOOGLE_MAPS_API_KEY=$VITE_GOOGLE_MAPS_API_KEY

RUN npm run build

# Production stage - nginx on port 80 (not 8000)
FROM nginx:alpine

# Remove default config
RUN rm /etc/nginx/conf.d/default.conf

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config and SSL template
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf
COPY nginx/ssl.conf.template /etc/nginx/ssl.conf.template
COPY nginx/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose 80 (HTTP) and 443 (HTTPS) - not 8000
EXPOSE 80 443

ENTRYPOINT ["/entrypoint.sh"]
