FROM caddy:2.10-alpine

WORKDIR /srv
COPY . /srv
COPY Caddyfile /etc/caddy/Caddyfile
