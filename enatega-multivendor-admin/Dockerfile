# Use Node.js 20 LTS as base image
FROM node:20-alpine

# Install system dependencies and curl for health check
RUN apk add --no-cache libc6-compat curl

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies (skip prepare scripts to avoid husky issues)
RUN npm install --omit=dev --ignore-scripts && npm cache clean --force

# Copy application code
COPY . .

# Build the Next.js application
RUN npm run build

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD curl -f http://localhost:3000/api/health || exit 1

# Start the application
CMD ["npm", "start"]