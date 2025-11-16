FROM node:21-alpine

# Tạo thư mục app và đặt làm working directory
WORKDIR /app

# Copy package.json và package-lock.json trước để cache layer cài đặt dependencies
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ mã nguồn vào container
COPY . .

# Expose port (phù hợp với PORT bạn đã đặt trong docker-compose)
EXPOSE 3003

# Lệnh chạy ứng dụng
CMD ["npm", "run", "start"]