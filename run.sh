#!/usr/bin/env sh

if [ "$1" == "--interactive" ]; then 
  FLAGS="--rm -it"
else
  FLAGS="-d --restart=always"
fi

docker rm asterisk --force

docker run $FLAGS \
  -p 5038:5038/tcp \
  -p 5060:5060/udp \
  -p 8000:8000/tcp \
  --name asterisk asterisk
