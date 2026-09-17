# Development stage
FROM node:20-alpine AS development

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Expose Vite dev server port
EXPOSE 8080

# Start development server
CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0"]

# Build stage
FROM node:20-alpine AS build

WORKDIR /app

ARG VITE_API_BASE_URL
ARG VITE_DISABLE_REGISTRATION=false
ARG VITE_MOCK_MODE=true

ENV VITE_API_BASE_URL=${VITE_API_BASE_URL}
ENV VITE_DISABLE_REGISTRATION=${VITE_DISABLE_REGISTRATION}
ENV VITE_MOCK_MODE=${VITE_MOCK_MODE}

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine AS production

# Copy built assets
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx/nginx.conf /etc/nginx/conf.d/default.conf

# Runtime configuration, written on container startup
COPY --chmod=755 docker/40-dmarco-runtime-config.sh /docker-entrypoint.d/40-dmarco-runtime-config.sh

# License and attribution notices, kept out of the web root
COPY LICENSE NOTICE /usr/share/doc/dmarco-dashboard/

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
