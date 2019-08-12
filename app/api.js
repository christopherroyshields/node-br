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
  log: false,
  libs: {
    "lexi":["fnApplyLexi"]
  }
})

// app.get('/', (req,res)=>{
//
// })

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
      .catch((err)=>{
        console.log("load failed");
        res.status(400).send({ error: 'Could not Load!' })
      })
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
    })
})

app.post('/api/v1/compile', (req, res) => {
  br.fn("ApplyLexi",":"+req.files.source.tempFilePath,":"+req.files.source.tempFilePath+".out")
    .catch((err)=>{
      res.status(400).send({ error: 'Could not compile!' })
    })
    .then(()=>{
      return br.sendCmd(`LOAD :${req.files.source.tempFilePath}.out,SOURCE\r`)
    })
    .then(()=>{
      return br.sendCmd(`SAVE :${req.files.source.tempFilePath}.br\r`)
    })
    .then(()=>{
      outputFile = `${req.files.source.tempFilePath}.br`
      console.log(outputFile);

      var stat = fs.statSync(outputFile);

      res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(outputFile);
      // We replaced all the event handlers with a simple call to readStream.pipe()
      readStream.pipe(res);

      fs.unlink(req.files.source.tempFilePath, (err) => {
        if (err) throw err;
        console.log(`${req.files.source.tempFilePath} was deleted`);
      });

      fs.unlink(outputFile, (err) => {
        if (err) throw err;
        console.log(`${outputFile} was deleted`);
      });

      fs.unlink(req.files.source.tempFilePath+".out", (err) => {
        if (err) throw err;
        console.log(`${req.files.source.tempFilePath}.out was deleted`);
      });

    })
})

br.on("ready", ()=>{
  app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
  })
})
