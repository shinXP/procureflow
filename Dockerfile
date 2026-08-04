FROM dunglas/frankenphp:1-php8.4-alpine

WORKDIR /app

RUN install-php-extensions \
    bcmath \
    gd \
    intl \
    opcache \
    pcntl \
    pdo_pgsql \
    zip

RUN apk add --no-cache nodejs npm

COPY --from=composer:2 /usr/bin/composer /usr/bin/composer
COPY . .

RUN composer install --no-dev --prefer-dist --no-interaction --optimize-autoloader \
    && npm ci \
    && npm run build \
    && rm -rf node_modules \
    && mkdir -p storage/framework/cache/data storage/framework/sessions storage/framework/views \
    && chmod +x /app/deploy/start.sh \
    && chown -R www-data:www-data storage bootstrap/cache

COPY deploy/Caddyfile /etc/caddy/Caddyfile

EXPOSE 8000

ENTRYPOINT ["/app/deploy/start.sh"]

