const express = require('express')
const fileUpload = require('express-fileupload')({
    useTempFiles : true,
    tempFileDir : '../br/tmp/'
})
const app = express();
const fs = require('fs');
const { finished } = require('stream');
const Br = require('./br.js')
const PORT = 3000

app.use(fileUpload);

br = new Br({
  log: false,
  libs: {
    "lexi":["fnApplyLexi"]
  }
})

app.get('/', (req,res)=>{

})

app.post('/api/v1/compile', function (req, res) {
  br.fn("ApplyLexi",":"+req.files.source.tempFilePath,":"+req.files.source.tempFilePath+".out")
    .then(()=>{
      return br.sendCmd(`LOAD :${req.files.source.tempFilePath}.out,SOURCE\r`)
    })
    .then(()=>{
      return br.sendCmd(`SAVE :${req.files.source.tempFilePath}.br\r`)
    })
    .then(()=>{
      filePath = `${req.files.source.tempFilePath}.br`
      console.log(filePath);

      var stat = fs.statSync(filePath);

      res.writeHead(200, {
          'Content-Type': 'application/octet-stream',
          'Content-Length': stat.size
      });

      var readStream = fs.createReadStream(filePath);
      // We replaced all the event handlers with a simple call to readStream.pipe()
      readStream.pipe(res);

      fs.unlink(req.files.source.tempFilePath, (err) => {
        if (err) throw err;
        console.log(`${req.files.source.tempFilePath} was deleted`);
      });

      fs.unlink(filePath, (err) => {
        if (err) throw err;
        console.log(`${filePath} was deleted`);
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
