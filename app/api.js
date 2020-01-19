const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const Br = require('./br.js')

const PORT = 3000
const HAS_LINE_NUMBERS = /^\s*\d{0,5}\s/

app.use(bodyParser.json({
  type: 'application/json',
  limit: '5mb'
}))

var compile = async function(lines, br){
}

app.post('/compile', async (req, res) => {
  const br = app.locals.br
  const result = {
    "error": 0,
    "line": 0,
    "message": "",
    "bin": ""
  }

  const { err, bin } = await queue.add(async ()=>{
    var lines = [];
    if (HAS_LINE_NUMBERS.test(req.body.lines[0])){
      lines = req.body.lines
    } else {
      lines = await br.applyLexi(req.body.lines)
    }
    return await br.compile(lines)
  })

  if (err){
    result.error = err.error
    result.line = err.line
    result.sourceLine = err.sourceLine
    result.message = err.message
  }

  if (bin){
    result.bin = bin.toString('base64')
  }

  res.setHeader('Content-Type', 'text/json');
  res.send(JSON.stringify(result))

})

app.post('/decompile', async (req, res) => {

  const br = app.locals.br
  const bin = Buffer.from(req.body.bin,'base64')

  res.setHeader('Content-Type', 'text/json');

  try {
    const lines = await queue.add(async ()=>{
      return await br.decompile(bin)
    })
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
