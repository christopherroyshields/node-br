#!/bin/sh
docker run -it \
  --init \
  -p 9229:9229 \
  -v "$PWD/app/test.js:/app/test.js" \
  -v "$PWD/app/run.js:/app/run.js" \
  -v "$PWD/app/br.js:/app/br.js" \
  -v "$PWD/br:/br" \
  --name node-br \
  --rm \
 brulescorp/br:node-br npm run-script test-debug
