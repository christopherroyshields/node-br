docker run -it ^
  --init ^
  -p 9229:9229 ^
  -p 3000:3000 ^
  -v "%cd%\app\package.json:/app/package.json" ^
  -v "%cd%\app\api.js:/app/api.js" ^
  -v "%cd%\app\run.js:/app/run.js" ^
  -v "%cd%\app\br.js:/app/br.js" ^
  -v "%cd%\br:/br" ^
  --name node-br ^
  --rm ^
 brulescorp/br:node-br npm run-script start-debug
