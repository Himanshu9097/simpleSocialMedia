FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json first to leverage Docker cache
COPY package*.json ./

# Install dependencies
RUN npm install

# Copy the rest of the backend files
COPY . .

# Expose the backend port (default 3000 or from .env)
EXPOSE 3000

# Start the Node server
CMD ["npm", "start"]
