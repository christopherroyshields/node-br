#!/bin/sh
docker run --init \
  -p 3000:3000 \
  -v "$PWD/brserial.dat:/br/brserial.dat" \
  --name node-br \
  --rm \
  brulescorp/br:node-br node cluster.js
