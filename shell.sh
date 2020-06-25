#!/bin/bash
# build and runs container shell.  for running br console or debugging.
docker build -t brulescorp/br:node-br .
docker run -it \
  --init \
  -p 9229:9229 \
  -p 3000:3000 \
  -v "$PWD/app/:/app" \
  -v "$PWD/br/:/br" \
  -v "$PWD/brserial.dat:/br/brserial.dat" \
  -v "$PWD/tmp/:/tmp" \
  -v "$PWD/brserial.dat:/br/brserial.dat" \
  --name node-br \
  --rm \
  brulescorp/br:node-br /bin/bash
