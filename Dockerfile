FROM node:22-alpine
WORKDIR /app
# Copy both package.json AND package-lock.json first
COPY package*.json ./
# Use 'ci' instead of 'install'
RUN npm ci
COPY . .
EXPOSE 3000 
CMD ["npm", "start"]
