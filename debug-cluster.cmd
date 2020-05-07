docker run -it ^
  --init ^
  -p 9229:9229 ^
  -p 9230:9230 ^
  -p 9231:9231 ^
  -p 9232:9232 ^
  -p 9233:9233 ^
  -p 3000:3000 ^
  -v "%CD%\app\package.json:/app/package.json" ^
  -v "%CD%\app\cluster.js:/app/cluster.js" ^
  -v "%CD%\app\api.js:/app/api.js" ^
  -v "%CD%\app\run.js:/app/run.js" ^
  -v "%CD%\app\br.js:/app/br.js" ^
  -v "%CD%\br:/br" ^
  -v "%CD%\brserial.dat:/br/brserial.dat" ^
  --name node-br ^
  --rm ^
 brulescorp/br:node-br npm run-script start-cluster-debug
