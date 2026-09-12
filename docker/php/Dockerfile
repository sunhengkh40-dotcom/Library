FROM php:8.4-fpm

RUN apt-get update && apt-get install -y libzip-dev unzip git \
    && docker-php-ext-install pdo_mysql zip

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

# Copy application code into the image (build context is the project root "."
# per docker-compose.yml / docker build -t laravel-api:local -f docker/php/Dockerfile .)
COPY backend/ /var/www/html/

# Install PHP dependencies
RUN composer install --no-dev --optimize-autoloader --no-interaction

# Copy entrypoint script and make it executable
COPY docker/php/entrypoint.sh /usr/local/bin/entrypoint.sh
RUN chmod +x /usr/local/bin/entrypoint.sh

ENTRYPOINT ["entrypoint.sh"]
CMD ["php-fpm"]