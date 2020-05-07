const express = require('express')
const app = express();
const bodyParser = require('body-parser')
const cluster = require('cluster');
const fs = require('fs').promises;
const Br = require('./br.js')
const os = require('os');
const { tmpNameSync } = require('tmp-promise');

const HAS_LINE_NUMBERS = /^\s*\d{0,5}\s/
const PORT = 3000
const IP = '0.0.0.0'

app.use(bodyParser.json({
  type: 'application/json',
  limit: '5mb'
}))

app.use((req, res, next) => {
  // set some custom br realted header at beginning of request
  res.set({
    'x-br-wsid': app.locals.br.wsid
  })

  next()
})

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
      <head>
        <title>Lexi API</title>
      </head>
      <body>
        <h1>Welcome to the Lexi API!</h1>
        <p>
          Lexi is a Lexical Preprocessor for the Business Rules language. It enables the BR Programmer <br>
          to use Modern Editors, and many modern program statements that aren't supported in BR directly. <br>
          Lexi makes line numbers optional, and adds Select Case, and Multiline Strings and Multiline Comments <br>
          and much much more, to Business Rules. <br>
        </p>
        <p>
          Web API by Christopher Shields
        </p>
        <em>Copyright Notices</em>
        <ul>
          <li>Copyright 2003 Gabriel Bakker</li>
          <li>Copyright 2007 Sage AX, LLC and Gabriel Bakker</li>
          <li>Copyright 2020 Christopher Shields</li>
        </ul>
      </body>
    </html>
    `)
})

app.post('/compile', async (req, res) => {

  const br = app.locals.br
  const result = {
    "error": 0,
    "line": 0,
    "message": "",
    "bin": null
  }

  if (req.body.lines){
    try {
      let tmpFile = await tmpNameSync()
      await fs.writeFile(tmpFile, req.body.lines.join(os.EOL), 'ascii')

      if (HAS_LINE_NUMBERS.test(req.body.lines[0])){
        var {err, bin} = await br.compile(tmpFile, false, false)
      } else {
        var {err, bin} = await br.compile(tmpFile, true, true)
      }

      if (err){
        result.error = err.error
        result.line = err.line
        result.sourceLine = err.sourceLine
        result.message = err.toString()
      }
      if (bin){
        result.bin = bin.toString('base64')
      }

    } catch(err){
      result.message = err.toString()
    }
  }

  res.setHeader('Content-Type', 'text/json');
  res.send(JSON.stringify(result))

  if (cluster.isWorker){
    process.send({
      cmd: 'request',
      wsid: br.wsid
    })
  }

})

app.post('/decompile', async (req, res) => {

  const br = app.locals.br
  let
    bin = Buffer.from(req.body.bin,'base64'),
    lines = null,
    source = null,
    e = null

  try {
    let tmpName = await tmpNameSync()
    let binPath = `${tmpName}.br`
    let sourcePath = `${tmpName}.brs`

    await fs.writeFile(`${binPath}`, bin, 'binary')
    await br.decompile(binPath, sourcePath)

    source = await fs.readFile(sourcePath, 'ascii')
    lines = source.split('\r\n')
  } catch(err){
    e = err
  }

  res.setHeader('Content-Type', 'text/json');
  res.send(JSON.stringify({lines}))

  try {
    fs.unlink(binPath)
    fs.unlink(sourcePath)
  } catch(err){
    console.error("Error removing files after decompile.", err);
  }

})

async function start(port, ip){
  app.locals.br = await Br.spawn()
  await new Promise((resolve)=>{
    app.listen(port, ip, ()=>{
      resolve()
    })
  })
  return app.locals.br
}

start(PORT, IP).then((br)=>{
  if (cluster.isWorker){
    process.send({
      cmd: `started`,
      wsid: br.wsid,
      concurrency: br.concurrency
    })
  } else {
    console.log(`Api started on port ${PORT} bound to IP ${IP} with WSID ${br.wsid}`)
  }
})
