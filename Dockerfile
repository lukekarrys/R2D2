FROM node:18-alpine3.17

LABEL org.opencontainers.image.source="https://github.com/lukekarrys/r2d2"

EXPOSE 5060/udp
EXPOSE 5038/tcp
EXPOSE 8000/tcp

WORKDIR /var/www/app

COPY lib lib/

COPY asterisk /etc/asterisk/

RUN	apk --no-cache --update add asterisk

CMD node lib/server.mjs & asterisk
