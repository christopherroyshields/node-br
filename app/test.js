const Br = require('./br.js')
const LoremIpsum = require("lorem-ipsum").LoremIpsum

const lorem = new LoremIpsum({
  sentencesPerParagraph: {
    max: 8,
    min: 4
  },
  wordsPerSentence: {
    max: 16,
    min: 4
  }
})

var hrstart = process.hrtime()
br = new Br({
  log:true
})

br.on("ready",(license)=>{
  console.log("license returned:" +license)
  var arrArg = ["arr1","arr2"]
  br.fn("open","mylib","testarg",1.1234,["abc123","the quick brown fox",20,5.4321],"testarg",1.1234,["abc123","the quick brown fox",20,5.4321],"testarg",1.1234,["abc123","the quick brown fox",20,5.4321],"testarg",1.1234,["abc123","the quick brown fox",20,5.4321],"testarg",1.1234,["abc123","the quick brown fox",20,5.4321],"testarg",1.1234,["abc123","the quick brown fox",20,5.4321])


  // start time
  // hrend = process.hrtime(hrstart)
  // console.info('Execution time (hr): %ds %dms', hrend[0], hrend[1] / 1000000)
  //
  // hrstart = process.hrtime()
  // br.set(`a`,lorem.generateWords(5)).then((data)=>{
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
