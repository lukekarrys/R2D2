#!/usr/bin/env sh

export $(cat .env | xargs)

docker build \
  -t asterisk \
  --build-arg ADMIN_USER=${ADMIN_USER} \
  --build-arg ADMIN_SECRET=${ADMIN_SECRET} \
  .
