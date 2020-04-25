docker build -t br:node-br .
docker run -it ^
  --init ^
  -v "%cd%\brserial.dat:/br/brserial.dat" ^
  --name node-br ^
  --rm ^
  br:node-br npm test
