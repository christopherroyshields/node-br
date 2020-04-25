#!/bin/sh
docker build -t br:node-br .
docker run -it ^
  --init ^
  -p 9229:9229 ^
  -p 3000:3000 ^
  -v "%cd%\brserial.dat:/br/brserial.dat" ^
  --name node-br ^
  --rm ^
  br:node-br /bin/bash
