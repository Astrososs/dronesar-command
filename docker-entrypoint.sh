#!/bin/sh
set -e

echo "Starting SAR Dashboard with BACKEND_PORT=${BACKEND_PORT:-8100}"

# Substitute environment variables in nginx config
envsubst '${BACKEND_PORT}' < /etc/nginx/conf.d/default.conf.template > /etc/nginx/conf.d/default.conf

# Debug: Show the generated config
echo "Generated nginx config:"
cat /etc/nginx/conf.d/default.conf | grep -A 5 "location /api/"

# Start nginx
exec nginx -g 'daemon off;'
