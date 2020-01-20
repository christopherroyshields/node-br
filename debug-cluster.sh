#!/bin/sh
docker run -it \
  --init \
  -p 9229:9229 \
  -p 9230:9230 \
  -p 9231:9231 \
  -p 9232:9232 \
  -p 9233:9233 \
  -p 3000:3000 \
  -v "$PWD/app/package.json:/app/package.json" \
  -v "$PWD/app/cluster.js:/app/cluster.js" \
  -v "$PWD/app/api.js:/app/api.js" \
  -v "$PWD/app/run.js:/app/run.js" \
  -v "$PWD/app/br.js:/app/br.js" \
  -v "$PWD/br:/br" \
  --name node-br \
  --rm \
  br:node-br npm run-script start-cluster-debug
