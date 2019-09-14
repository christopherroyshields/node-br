const express = require('express')
const fileUpload = require('express-fileupload')
const app = express();
const fs = require('fs');
const path = require('path');
const { finished } = require('stream');
const Br = require('./br.js')
const PORT = 3000

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '../br/tmp/'
}));

br = new Br({
  log: true,
  libs: {
    "lexi":["fnApplyLexi"]
  }
})

app.get('/api/v1/decompile', function(req,res) {
  var form = `
    <html>
      <head>
        <title>Decompile</title>
      </head>
      <body>
        <form method="post">
          <label for="object">Object:</label>
          <input type="file"
            id="object" name="object" />
          <button type="submit">Submit</button>
        </form>
      </body>
    </html>
  `
  res.status(200).send(form)
})

app.post('/api/v1/decompile', function(req, res) {
  req.files.object.mv(`${req.files.object.tempFilePath}.br`, function(err) {
    br.sendCmd(`list <:${req.files.object.tempFilePath}.br >:${req.files.object.tempFilePath}.brs\r`)
      .then(()=>{
        // outputFile = `${req.files.object.tempFilePath}.brs`
        outputFile = `${req.files.object.tempFilePath}.brs`
        console.log(outputFile);

        var stat = fs.statSync(outputFile);

        res.writeHead(200, {
            'Content-Type': 'text/br',
            'Content-Length': stat.size
        });

        var readStream = fs.createReadStream(outputFile);
        // We replaced all the event handlers with a simple call to readStream.pipe()
        readStream.pipe(res);

        fs.unlink(`${req.files.object.tempFilePath}.br`, (err) => {
          if (err) throw err;
          console.log(`${req.files.object.tempFilePath} was deleted`);
        });

        fs.unlink(outputFile, (err) => {
          if (err) throw err;
          console.log(`${outputFile} was deleted`);
        });

      })
      .catch((err)=>{
        console.log("load failed");
        res.status(400).send(err)
      })
    })
})

app.put('/api/v1/compile', (req, res) => {
  debugger
})

app.post('/api/v1/compile', (req, res) => {
  var sourceFile = req.files.source.tempFilePath
  var outputFile = `${sourceFile}.out.brs`
  var objectFile = `${sourceFile}.br`
  console.log("Lexifying...");
  br.fn("ApplyLexi",":"+sourceFile,":"+outputFile)
    .then(()=>{
      console.log("Loading...");
      return br.sendCmd([
        `LOAD :${outputFile},SOURCE`
      ])
    })
    .then(()=>{
      console.log("Saving to '.br'...");
      return br.sendCmd([
        `SAVE :${objectFile}`,
        `CLEAR ALL`
      ])
    })
    .then(()=>{
      fs.unlink(outputFile, (err) => {
        if (err) {
          console.log(`${outputFile} was NOT deleted`);
        } else {
          console.log(`${outputFile} was deleted`);
        }
      });
      console.log("Sending back");
      var stat = fs.statSync(objectFile);
      res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(objectFile);
      // We replaced all the event handlers with a simple call to readStream.pipe()
      readStream.pipe(res);

      res.on('finish', ()=>{
        console.log("finished sending")
        fs.unlink(objectFile, (err) => {
          if (err) {
            console.log(`${objectFile} was NOT deleted`);
          } else {
            console.log(`${objectFile} was deleted`);
          }
        });
      })
    })
    .catch((err)=>{
      var {message,line,clause,output,error,command}=err
      if (command===`LOAD :${outputFile},SOURCE`){
        // console.log(`TEST:LIST >:./tmp/${path.basename(sourceFile)}.prt.brs`);
        br.sendCmd([
          `LIST >:./tmp/${path.basename(sourceFile)}.part.brs`
        ]).then(()=>{
          let
            i,
            count = 0
          fs.createReadStream(`${sourceFile}.part.brs`)
            .on('data', function(chunk) {
              for (i=0; i < chunk.length; ++i)
                if (chunk[i] == 10) count++;
            })
            .on('end', function() {
              br.sendCmd([
                `CLEAR ALL`
              ]).then(()=>{
                var lastLine = count
                // console.log(count);
                res.status(400).send({message,line,clause,output,error,lastLine})
              })
            });
        }).catch((err)=>{
          var {message,line,clause,output,error,command}=err
          // console.log("Error evaluating load error\n:" + err);
          var lastLine=0
          res.status(400).send({message,line,clause,output,error,lastLine})
        })
      }
    })
})

br.on("load_error", (errors)=>{
  throw new Error("Error loading BR.\n" + errors.join("\n"))
})

br.on("ready", ()=>{
  app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
  })
})
