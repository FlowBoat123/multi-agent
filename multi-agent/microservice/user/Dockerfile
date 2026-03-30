FROM node:21-alpine

WORKDIR /app

# Copy package.json và package-lock.json trước để cache npm install
COPY package*.json ./

RUN npm install

# Copy toàn bộ source code vào image
COPY . .

EXPOSE 3004
CMD ["npm", "run", "start"]