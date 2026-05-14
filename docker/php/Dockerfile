FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    bash git curl libpq-dev libzip-dev zip unzip oniguruma-dev icu-dev linux-headers autoconf g++ make \
 && docker-php-ext-install pdo pdo_pgsql pgsql bcmath zip intl pcntl \
 && pecl install redis && docker-php-ext-enable redis

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www
EXPOSE 9000
CMD ["php-fpm"]
