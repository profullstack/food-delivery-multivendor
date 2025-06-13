# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install system dependencies for native modules
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    cairo-dev \
    jpeg-dev \
    pango-dev \
    musl-dev \
    giflib-dev \
    pixman-dev \
    pangomm-dev \
    libjpeg-turbo-dev \
    freetype-dev

# Create non-root user for security (do this early)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

# Set working directory and change ownership
WORKDIR /app
RUN chown nodejs:nodejs /app

# Switch to nodejs user for dependency installation
USER nodejs

# Copy package files with correct ownership
COPY --chown=nodejs:nodejs package*.json ./

# Install dependencies as nodejs user
RUN npm ci --only=production && npm cache clean --force

# Copy application code with correct ownership
COPY --chown=nodejs:nodejs . .

# Expose port
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node healthcheck.js

# Start the application
CMD ["npm", "start"]