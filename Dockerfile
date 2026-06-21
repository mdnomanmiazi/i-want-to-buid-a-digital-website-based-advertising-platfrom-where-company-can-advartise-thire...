FROM node:22-alpine
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy the rest of your application code
COPY . .

# 3. BUILD THE APP (This creates the missing /dist/server/server.js file!)
RUN npm run build

# 4. Expose the port and start the preview server
EXPOSE 3000 
CMD ["npm", "start"]
