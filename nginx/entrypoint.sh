#!/bin/sh
set -e

# Generate SSL config only when DOMAIN is set and certs exist
if [ -n "$DOMAIN" ] && [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
  echo "Configuring HTTPS for domain: $DOMAIN"
  envsubst '${DOMAIN}' < /etc/nginx/ssl.conf.template > /etc/nginx/conf.d/ssl.conf
else
  echo "HTTPS disabled (set DOMAIN and run certbot to enable)"
fi

exec nginx -g "daemon off;"
