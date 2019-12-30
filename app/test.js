const {expect} = require('chai')
const BrProcess = require('./run.js')
const Br = require('./br.js');

describe("Br class for high level abstraction", function() {
  var tmp = {};
  before(async function(){
    tmp = await Br.spawn()
  })

  after(async function(){
    await tmp.stop()
  })

  describe("Process Factory", function() {
    it("Should spawn a br process", async function(){
      expect(tmp.wsid>0).to.equal(true)
    })
  })

  describe("Library Function", function() {
    it("Should call a library function", async function(){
      // create Library
      await tmp.proc([
        "10 def library fntest(&a,&b)",
        "20   let a = 10",
        "30   let b = 20",
        "40   let fntest = 30",
        "50 fnend",
        "list >testlib.brs",
        "replace testlib",
        "clear"
      ])

      tmp.libs = {
        "testlib":["fntest"]
      }

      var output = await tmp.fn("test", 1, 2)
      console.log(output);
      expect(output.results[0]).to.equal(10)
      expect(output.results[1]).to.equal(20)
      expect(output.return).to.equal(30)

      await tmp.proc([
        "10 def library fntest$(&a$,&b$)",
        "20   let a$ = a$&'test1'",
        "30   let b$ = b$&'test2'",
        "40   let fntest$ = 'test return'",
        "50 fnend",
        "list >testlib.brs",
        "replace testlib",
        "clear"
      ])

      tmp.libs = {
        "testlib":["fntest$"]
      }

      var output = await tmp.fn("test$", "in1", "in2")
      console.log(output);
      expect(output.results[0]).to.equal("in1test1")
      expect(output.results[1]).to.equal("in2test2")
      expect(output.return).to.equal('test return')

    })
  })

})

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
      expect(br.wsid>0).to.equal(true);
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
