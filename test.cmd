docker run -it ^
  --init ^
  -v "%cd%\brserial.dat:/br/brserial.dat" ^
  --name node-br ^
  --rm ^
 brulescorp/br:node-br npm test
