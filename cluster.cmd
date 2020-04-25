docker run -it ^
  --init ^
  -p 3000:3000 ^
  -v "%CD%\brserial.dat:/br/brserial.dat" ^
  --name node-br ^
  --rm ^
  br:node-br npm run-script start-cluster
