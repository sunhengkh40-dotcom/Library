FROM php:8.4-fpm
RUN apt-get update && apt-get install -y libzip-dev unzip git \
    && docker-php-ext-install pdo_mysql zip
COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
WORKDIR /var/www/html