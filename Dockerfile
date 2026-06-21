FROM node:22-alpine
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy code
COPY . .

# 3. Tell Nitro to build for Node.js instead of Cloudflare
ENV NITRO_PRESET=node-server

# 4. Build the application
RUN npm run build

# 5. Expose port
EXPOSE 3000 

# 6. Run the compiled Nitro backend server
CMD ["node", ".output/server/index.mjs"]
