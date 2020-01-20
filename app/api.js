const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const Br = require('./br.js')

const {default: PQueue} = require('p-queue');
const queue = new PQueue({concurrency: 1});

const PORT = 3000

app.use(bodyParser.json({
  type: 'application/json',
  limit: '5mb'
}))

app.post('/compile', async (req, res) => {
  const br = app.locals.br
  const result = {
    "error": 0,
    "line": 0,
    "message": "",
    "bin": ""
  }

  const { err, bin } = await queue.add(async ()=>{
    return await br.compile(req.body.lines)
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
  process.send({
    cmd: 'request',
    wsid: br.wsid
  })

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

async function start(port){
  app.locals.br = await Br.spawn()
  await new Promise((resolve)=>{
    app.listen(port, ()=>{
      resolve()
    })
  })
  return app.locals.br
}

start(3000).then((br)=>{
  process.send({
    cmd: `started`,
    wsid: br.wsid,
    concurrency: br.concurrency
  })
})
