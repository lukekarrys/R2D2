#!/usr/bin/env sh

docker build -t asterisk .
docker run --rm -ti -p 5060:5060/udp asterisk
