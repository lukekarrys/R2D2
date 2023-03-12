FROM node:18-alpine3.17

EXPOSE 5060/udp
EXPOSE 5038/tcp
EXPOSE 8000/tcp

WORKDIR /var/www/app

COPY package.json .
COPY package-lock.json .
COPY lib lib/
RUN npm install --omit=dev

COPY asterisk /etc/asterisk/
RUN	apk --no-cache --update add asterisk

CMD node lib/server.mjs & asterisk
