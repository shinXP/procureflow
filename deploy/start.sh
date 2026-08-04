#!/bin/sh
set -eu

php artisan storage:link --force
php artisan migrate --force

if [ "${SEED_DEMO_DATA:-false}" = "true" ]; then
    php artisan db:seed --force
fi

php artisan config:cache
php artisan view:cache

exec frankenphp run --config /etc/caddy/Caddyfile

