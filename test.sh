#!/bin/sh
docker run -it \
  --init \
  -v "$PWD/brserial.dat:/br/brserial.dat" \
  --name node-br \
  --rm \
  br:node-br npm test
