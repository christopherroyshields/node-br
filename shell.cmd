docker build -t brulescorp/br:node-br .
docker run -it^
  --init^
  -p 9229:9229^
  -p 3000:3000^
  -v "%cd%\app\:/app"^
  -v "%cd%\br\:/br"^
  -v "%cd%\brserial.dat:/br/brserial.dat"^
  -v "%cd%\tmp\:/tmp"^
  --name node-br^
  --rm^
  brulescorp/br:node-br /bin/bash
