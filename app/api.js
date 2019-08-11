const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
const fs = require('fs');
const { finished } = require('stream');

app.use(fileUpload({
    useTempFiles : true,
    tempFileDir : '../br/tmp/'
}));
const Br = require('./br.js')

const PORT = 3000


br = new Br({
  log: true
})

app.post('/api/v1/compile', function (req, res) {
  br.compile(req.files.source.tempFilePath)
    .then((filePath)=>{
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

    })
})

br.on("ready", ()=>{
  app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
  })
})
