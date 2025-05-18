
# Stage 1: Build the React + Vite app
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Install dependencies required for WebAssembly and media processing
RUN apk add --no-cache python3 make g++ libc6-compat

# Copy package.json and package-lock.json
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci --prefer-offline --no-audit --progress=false

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build:prod

# Stage 2: Serve with Nginx
FROM nginx:1.25-alpine

# Copy custom nginx configuration
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Copy built assets from the build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Add non-root user for security
RUN addgroup -g 1001 -S appuser && \
    adduser -u 1001 -S appuser -G appuser && \
    chown -R appuser:appuser /usr/share/nginx/html && \
    chmod -R 755 /usr/share/nginx/html && \
    chown -R appuser:appuser /var/cache/nginx && \
    chown -R appuser:appuser /var/log/nginx && \
    touch /var/run/nginx.pid && \
    chown -R appuser:appuser /var/run/nginx.pid

# Switch to non-root user
USER appuser

# Expose port 8080
EXPOSE 8080

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
