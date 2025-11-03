# Stage 1: Build the application
FROM node:18-alpine as build

# Set the working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev dependencies for building)
RUN npm install

# Copy the rest of the application code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Serve the application using a Node.js server that can handle API routes
FROM node:18-alpine

# Set the working directory
WORKDIR /app

# Copy package files and install production dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy the built application from the first stage and the server file
COPY --from=build /app/dist ./dist
COPY server.js ./
COPY src/lib/nik_parse.js ./src/lib/nik_parse.js

# Expose port 80
EXPOSE 80

# Serve the application with API support
CMD ["node", "server.js"]
