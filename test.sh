#!/bin/sh
docker run -it \
  --init \
  -p 3000:3000 \
  -p 9229:9229 \
  -v "$PWD/brserial.dat:/br/brserial.dat" \
  --name node-br \
  --rm \
  br:node-br node --inspect=0.0.0.0:9229 test
