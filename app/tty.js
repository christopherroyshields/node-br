const Br = require('./br.js')

ps = new Br({
  log:true
})
ps.on("ready",(license)=>{
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
  })
  ps.set(`b`,5).then((data)=>{
    console.log(`command output: ${data}`)
  })
  // ps.set(`b`,[5,4,5,4,6,1]).then((data)=>{
  //   console.log(`command output: ${data}`)
  // })
  ps.getVal(`a`,'string').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.getVal(`b`,'number').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
})
