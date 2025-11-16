FROM nginx:alpine

# Remove default nginx config
RUN rm -rf /etc/nginx/conf.d/*

# Copy custom configuration files
COPY ./nginx.conf /etc/nginx/conf.d/nginx.conf

# Create directory structure for frontend files if needed
RUN mkdir -p /usr/share/nginx/html

# Create a simple index.html to test the setup
RUN echo '<!DOCTYPE html>\
<html>\
<head>\
    <title>Microservices Application</title>\
    <style>\
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }\
        h1 { color: #333; }\
        .services { background: #f4f4f4; padding: 20px; border-radius: 5px; }\
        .service { margin-bottom: 10px; padding: 10px; background: #fff; border-left: 3px solid #4CAF50; }\
    </style>\
</head>\
<body>\
    <h1>Microservices Application</h1>\
    <p>Welcome to the microservices application. The following services are available:</p>\
    <div class="services">\
        <div class="service">\
            <strong>Document Service:</strong> <a href="/api/document">/api/document</a>\
        </div>\
        <div class="service">\
            <strong>Admin Service:</strong> <a href="/api/admin">/api/admin</a>\
        </div>\
        <div class="service">\
            <strong>Chat Service:</strong> <a href="/api/chat">/api/chat</a>\
        </div>\
    </div>\
</body>\
</html>' > /usr/share/nginx/html/index.html

# Expose port 81
EXPOSE 80

# Start Nginx server
CMD ["nginx", "-g", "daemon off;"]