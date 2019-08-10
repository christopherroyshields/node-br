const express = require('express');
const fileUpload = require('express-fileupload');
const app = express();
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
    .then(()=>{
      console.log("compiled");
    })
    // .catch((err)=>{
    //
    // })
})

br.on("ready", ()=>{
  app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
  })
})
