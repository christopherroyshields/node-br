docker run -it ^
  --init ^
  -p 3000:3000 ^
  -v "%CD%\brserial.dat:/br/brserial.dat" ^
  --rm ^
  brulescorp/br:node-br
