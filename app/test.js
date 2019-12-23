const {expect} = require('chai');
const BrProcess = require('./run.js')

var hrstart = process.hrtime()

describe('Br Process:', function() {
  const br = new BrProcess()

  describe('Start', function() {
    it('Should start a BR process', async function() {
      await br.start()
      expect(br.wsid).to.equal(1);
    });
  })

  describe('Cmd', function() {
    it('Should execute command and return result', async function() {
      var result = await br.cmd("len('john')")
      expect(result[1]).to.equal(' 4');
    })

    it('Should enter lines then run', async function(){
      // can't seem to enter plus symbol here!
      var result = await br.proc([
        'let a = 5*5',
        'let b = 10',
        'print a*b'
      ])
      console.log(result);
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
