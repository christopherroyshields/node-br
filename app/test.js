const Br = require('./br.js')
var hrstart = process.hrtime()

br = new Br({
  log: true,
  libs: {
    "testlib":["fntest"]
  }
})

br.on("ready",(license)=>{
  console.log("license returned:" +license)
  var arrArg = ["arr1",80085]
  // br.lib("testlib",["test"])
  br.compile("/br/testlib.brs")
    .then((success)=>{
      console.log(`program compiled:${success.toString()}`)
    })


  // br.fn("test","testarg",1.1234,arrArg)

  // start time
  // hrend = process.hrtime(hrstart)
  // console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
  //
  // hrstart = process.hrtime()
  // br.set(`a`,"test").then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`length: ${data.length}`)
  //   console.log(`status: ${br.state}`)
  //   console.log(`error: ${br.error}`)
  //   console.log(`line: ${br.lineNum}`)
  //   console.log(`clause: ${br.clause}`)
  //   hrend = process.hrtime(hrstart)
  //   console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
  // })
  //
  // br.set(`testnum`,7.4356).then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${br.state}`)
  // })
  // //
  // // br.set(`a`,"test").then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // // br.set(`a`,"test").then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // // br.set(`a`,"test").then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // // br.set(`a`,"test").then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // // br.set(`a`,"test").then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // br.set(`num`,10).then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${br.state}`)
  // })
  // //
  // br.getVal(`num`,'number').then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${br.state}`)
  // })
  // //
  // // br.getVal(`a`,'string').then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // br.getVal(`a`,'string').then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${br.state}`)
  // })
  // //
  // //
  // //
  // // br.set(`b`,[5,4,3,2]).then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // // br.getVal(`b`,'number',3).then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // //
  // // // console.log(br.getVal(`b`,'number'))
  // // br.getVal(`c`,'numberarray').then((data)=>{
  // //   console.log(`command output: ${data}`)
  // //   console.log(`status: ${br.state}`)
  // // })
  // br.getVal(`a`,'string').then((data)=>{
  //   console.log(`command output: ${data}`)
  //   console.log(`status: ${br.state}`)
  // })

})
