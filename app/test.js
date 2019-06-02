const Br = require('./br.js')

ps = new Br({
  log:true
})

ps.on("ready",(license)=>{
  console.log("license returned:" +license)
  // ps.sendCmd("DIR").then((data)=>{
  //   console.log(data)
  //   ps.sendCmd("DIR").then((data)=>{
  //     console.log(data)
  //   })
  // })
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
    // ps.set(`b`,[5,4,2,7]).then((data)=>{
    //   console.log(`command output: ${data}`)
    // })
    // ps.getVal(`a`,'string').then((data)=>{
    //   console.log(`command output: ${data}`)
    //   console.log(`status: ${ps.state}`)
    // })
  })
  ps.set(`a`,7).then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.set(`a`,"test").then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })

  ps.getVal(`a`,'string').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })

  ps.getVal(`a`,'string').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })

  ps.getVal(`a`,'string').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.getVal(`a`,'string').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  ps.getVal(`a`,'string').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })
  // ps.set(`b`,5).then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${ps.state}`)
  // })
  // ps.set(`c`,6).then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${ps.state}`)
  // })
  // ps.set(`d`,7).then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${ps.state}`)
  // })
  ps.set(`c`,[5,4,3,2]).then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })

  // ps.sendCmd("print SRep$(\"Wow that fish was that big.\",\"that\",\"this\")\r").then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${ps.state}`)
  // })

  // console.log(ps.getVal(`b`,'number'))
  ps.getVal(`c`,'number',3).then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })

  // console.log(ps.getVal(`b`,'number'))
  ps.getVal(`c`,'numberarray').then((data)=>{
    console.log(`command output: ${data}`)
    console.log(`status: ${ps.state}`)
  })

  // ps.getVal(`d`,'number').then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${ps.state}`)
  // })
})
