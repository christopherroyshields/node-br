#!/bin/sh
docker run -it \
  --init \
  -p 9229:9229 \
  -p 3000:3000 \
  -v "$PWD/app/package.json:/app/package.json" \
  -v "$PWD/app/api.js:/app/api.js" \
  -v "$PWD/app/run.js:/app/run.js" \
  -v "$PWD/app/br.js:/app/br.js" \
  -v "$PWD/br:/br" \
  --name node-br \
  --rm \
 brulescorp/br:node-br npm run-script start-debug
