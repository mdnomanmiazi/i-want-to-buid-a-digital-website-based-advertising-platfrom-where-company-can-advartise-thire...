FROM node:22-alpine
WORKDIR /app

# 1. Install dependencies
COPY package*.json ./
RUN npm install

# 2. Copy the rest of your application code
COPY . .

# 3. BUILD THE APP (This will now generate .output/server/index.mjs)
RUN npm run build

# 4. Expose the port, set the env variables, and start the standalone server
EXPOSE 3000 
ENV PORT=3000
ENV HOST=0.0.0.0

CMD ["node", ".output/server/index.mjs"]
