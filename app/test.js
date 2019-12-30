const {expect, done} = require('chai');
const BrProcess = require('./run.js')

describe('BrProcess', function() {

  const br = new BrProcess()

  before(async function() {
    await br.start()
  })

  after(async function() {
    await br.stop()
  })

  describe('Startup', function(){
    it("should have assigned a workstation id", function(done){
      expect(br.wsid).to.equal(1);
      done()
    })
  })

  describe('Commands', function(){
    it("Should run command and return any output", async function(){

      var output = ""
      output = await br.cmd("10 let a = 10")
      expect(output.length).to.equal(2);

      output = await br.cmd("20 let b = 20")
      expect(output.length).to.equal(2);

      output = await br.cmd("30 let c = a*b")
      expect(output.length).to.equal(2);

      output = await br.cmd("40 let d = a*b*c")
      expect(output.length).to.equal(2);

      output = await br.cmd("50 print a,b,c,d")
      expect(output.length).to.equal(2);

      output = await br.cmd("run")
      expect(output.length).to.equal(4);

    })

    it("Proc method should run array of commands and return results for each", async function(){
      var output = ""
      output = await br.proc([
        '60 let x = d-50',
        '70 print x',
        'run'
      ])
      expect(output.length).to.equal(3);
    })

  })

});

// br.on("ready",(license)=>{
//   console.log("license returned:" +license)
//
//   console.log(`copy:${br.copyright}`)
//   console.log(`config:${br.config_messages}`)
//   console.log(`license_text:${br.license.license_text}`)
//   console.log(`licensee:${br.license.licensee}`)
//   console.log(`licensee address:${br.license.licensee_address}`)
//   console.log(`serial:${br.serial}`)
//
//   console.log(`concurrency:${br.concurrency}`)
//   console.log(`stations:${br.stations}`)
//   console.log(`wsid:${br.wsid}`)
//
//   var arrArg = ["arr1",80085]
  // br.lib("testlib",["test"])
  // br.compile("/br/testlib.brs")
  //   .then((success)=>{
  //     console.log(`program compiled:${success.toString()}`)
  //   })


  // br.fn("test","testarg",1.1234,arrArg)
  //   .then((results)=>{
  //     console.log(results)
  //   })

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

// })
