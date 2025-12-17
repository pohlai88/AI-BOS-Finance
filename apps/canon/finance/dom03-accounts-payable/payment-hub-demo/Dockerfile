FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package.json ./
RUN npm install

# Copy source
COPY . .

# Run with tsx for TypeScript support
CMD ["npx", "tsx", "src/index.ts"]

EXPOSE 4000
