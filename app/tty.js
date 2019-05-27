const BrProcess = require('./run.js')
const BrConsole = require('./console.js')

const ps = new BrProcess({
  log: true
})

ps.sendCmd(`10 library "switch.br":fnmylib`)
ps.sendCmd(`20 let fnmylib`)
ps.sendCmd(`RUN`)
ps.sendCmd(`RUN`)
ps.sendCmd(`RUN`)
ps.sendCmd(`RUN`)
ps.sendCmd(`RUN`)

// const cs = new BrConsole()
