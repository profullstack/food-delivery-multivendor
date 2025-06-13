# Use Node.js 18 LTS as base image
FROM node:18-alpine

# Install system dependencies and curl for health check
RUN apk add --no-cache libc6-compat curl

# Create non-root user for security (do this early)
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# Set working directory and change ownership
WORKDIR /app
RUN chown nextjs:nodejs /app

# Switch to nextjs user for dependency installation
USER nextjs

# Copy package files with correct ownership
COPY --chown=nextjs:nodejs package*.json ./

# Install dependencies as nextjs user
RUN npm ci --only=production && npm cache clean --force

# Copy application code with correct ownership
COPY --chown=nextjs:nodejs . .

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]