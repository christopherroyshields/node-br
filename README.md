# Description
This is a tool to provide a Node.js interface to the Business Rules Programming Language through it's terminal interface

# TODO
~~Need to add proper tokenization using something like https://github.com/rse/tokenizr~~

* Add compile
* Add run function

# Example commands
### BUILD
``` bash
docker build . \
 -t node-br
```

### RUN
``` bash
docker run -it \
 -v C:\\Users\\admin\\projects\\node-br\\brserial.dat:/br/brserial.dat \
 -v C:\\Users\\admin\\projects\\node-br\\app:/app \
 node-br
```

## Run Shell
``` bash
docker run -it \
 -v C:\\Users\\admin\\projects\\node-br\\brserial.dat:/br/brserial.dat \
 -v C:\\Users\\admin\\projects\\node-br\\app:/app \
 node-br \
 bash
```
