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

# Stage 2: Serve the application using a lightweight server
FROM node:18-alpine

# Install a simple static server
RUN npm install -g serve

# Set the working directory
WORKDIR /app

# Copy the built application from the first stage
COPY --from=build /app/dist ./dist

# Expose port 80
EXPOSE 80

# Serve the application
CMD ["serve", "-s", "dist", "-l", "80"]