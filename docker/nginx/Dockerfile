FROM nginx:alpine

# Nginx needs access to the Laravel "public" folder to serve static assets
# (images, css, js) directly, and to resolve SCRIPT_FILENAME for PHP requests
# that get proxied to laravel-api. Build context is the project root ".".
COPY backend/public /var/www/html/public