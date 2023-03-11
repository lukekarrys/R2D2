FROM alpine:3.17
EXPOSE 5060/udp
COPY config /etc/asterisk/
RUN	apk --no-cache --update add asterisk
CMD	asterisk
