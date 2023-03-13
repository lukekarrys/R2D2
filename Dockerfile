FROM node:18-alpine3.17

ARG ADMIN_SECRET
RUN [ -z "$ADMIN_SECRET" ] && echo "ADMIN_SECRET is required" && exit 1 || true

ARG ADMIN_USER
RUN [ -z "$ADMIN_USER" ] && echo "ADMIN_USER is required" && exit 1 || true

EXPOSE 5060/udp
EXPOSE 5038/tcp
EXPOSE 8000/tcp

WORKDIR /var/www/app

COPY package.json .
COPY package-lock.json .
COPY lib lib/
RUN npm install --omit=dev

COPY asterisk /etc/asterisk/
RUN sed -i "s/{ADMIN_USER}/${ADMIN_USER}/g" /etc/asterisk/manager.conf
RUN sed -i "s/{ADMIN_SECRET}/${ADMIN_SECRET}/g" /etc/asterisk/manager.conf

RUN	apk --no-cache --update add asterisk

CMD node lib/server.mjs & asterisk
