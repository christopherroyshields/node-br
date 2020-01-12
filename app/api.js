const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const Br = require('./br.js')

const PORT = 3000
const HAS_LINE_NUMBERS = /^\s*\d{0,5}\s/

app.use(bodyParser.json({
  type: 'application/json'
}))

app.post('/compile', async (req, res) => {

  const br = app.locals.br
  const result = {
    "error": "",
    "bin": ""
  }

  var lines = []
  if (HAS_LINE_NUMBERS.test(req.body.lines[0])){
    lines = req.body.lines
  } else {
    lines = await br.applyLexi(req.body.lines)
  }

  const { err, bin } = await br.compile(lines)

  if (err){
    result.error = err
  }

  if (bin){
    result.bin = bin.toString('base64')
  }

  res.send(JSON.stringify(result))

})

app.post('/decompile', async (req, res) => {

  const br = app.locals.br
  const bin = Buffer.from(req.body.bin,'base64')

  try {
    var lines = await br.decompile(bin)
    res.send(JSON.stringify({
      "lines": lines
    }))
  } catch(err){
    res.send(JSON.stringify({
      "error": err
    }))
  }

})

Br.spawn().then((br)=>{
  br.libs = [{
    path: `:/br/lexi`,
    fn: ["fnApplyLexi"]
  }]

  app.locals.br = br

  app.listen(PORT,()=>{
    console.log(`Server listening on port ${PORT}`);
  })
})
