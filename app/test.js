const {expect} = require('chai')
const BrProcess = require('./run.js')
const Br = require('./br.js');
const os = require('os');
const fs = require('fs').promises;
const { tmpNameSync } = require('tmp-promise');

describe("Br class for high level abstraction", function() {
  var
    tmp = {},
    tmp2 = {},
    tmpPath = '',
    tmpSource = '',
    tmpOut = '',
    tmpMap = ''

  before(async function(){
    tmp = await Br.spawn()
    tmp2 = await Br.spawn()
    tmpPath = await tmpNameSync()
    tmpSource = `${tmpPath}.brs`
    tmpOut = `${tmpPath}.out`
    tmpMap = `${tmpPath}.map`
  })

  after(async function(){
    await tmp.stop()
    await tmp2.stop()
  })

  describe("Process Factory", function() {
    it("Should spawn a br process", async function(){
      expect(tmp.wsid>0).to.equal(true)
      expect(tmp2.wsid>0).to.equal(true)
    })
  })

  describe("applyLexi", function() {
    it("Should should preprocess br code", async function(){
      var lines = [
        'let a = 1',
        'let b = 2',
        'let c$ = `teststring`'
      ]

      await fs.writeFile(tmpSource, lines.join(os.EOL), 'ascii')

      await tmp.applyLexi(tmpSource, tmpOut, tmpMap, true)

      var lexiOutput = await fs.readFile(tmpOut)
      var outputLines = lexiOutput.toString().split(os.EOL)

      expect(outputLines[0]).to.equal('00001 let a = 1')
      expect(outputLines[1]).to.equal('00002 let b = 2')
      expect(outputLines[2]).to.equal('00003 let c$ = "teststring"')

    })
  })

  describe("Compile", function(){
    it("Should create a br program from source", async function(){

      var lines = [
        `10 let a = 1`,
        `20 let b = "a"`
      ]

      await fs.writeFile(tmpSource, lines.join(os.EOL), 'ascii')
      var compileResult = await tmp.compile(tmpSource, true, false)

      expect(compileResult.err.error).to.equal(1026)
      expect(compileResult.err.sourceLine).to.equal(2)

      var lines = [
        `10 let a = 1`,
        `20 let b = fntest`
      ]

      await fs.writeFile(tmpSource, lines.join(os.EOL), 'ascii')
      var compileResult = await tmp.compile(tmpSource, true, false)

      expect(compileResult.err.error).to.equal(302)
      expect(compileResult.err.output[1]).to.equal(" FNTEST")

      var lines = [
        `10 let a = 1`
      ]

      await fs.writeFile(tmpSource, lines.join(os.EOL), 'ascii')
      var compileResult = await tmp.compile(tmpSource, true, false)
      var list = await tmp.cmd(`list <:${compileResult.binPath}`)

      expect(compileResult.err).to.equal(null)
      expect(compileResult.binPath.length>0).to.equal(true)
      expect(list[1]).to.equal(" 00010 LET A = 1 ")

    })
  })

  describe("De-compile", function(){
    it("Should return array of lines from buffer", async function(){

      var buf = Buffer.from("AAAAMwAAABQMJgOAAAAAAAChAAAAKAAAAEcAAAAcAAAAAgAAAGMAAAA+AAAABAEYAAAACQIAAQEBDQBBQAkCAgEDAQ0AQUAIAAAKAAAAAQAAAAIAAQgAABQAAAALAAAAFv/+AQFBAAAAAAAAAAAAAQAAIAAAAAAAAAA/8AAAAAAAAAEBQgAAAAAAAAAAAAEAACAAAAAAAAAAQAAAAAAAAAAAFAEwMDAxMAEBBQVBID0gMQA2cgAUATAwMDIwAQEFBUIgPSAyAAoA", 'base64')
      await fs.writeFile("/tmp/test.br", buf)
      await tmp.decompile("/tmp/test.br", "/tmp/test.brs")
      var lines = (await fs.readFile("/tmp/test.brs", 'ascii')).split("\r\n")

      expect(lines[0]).to.equal("00010 LET A = 1")
      expect(lines[1]).to.equal("00020 LET B = 2")
    })
  })

  describe("Library Function", function() {
    it("Should call a library function", async function(){
      // create Library
      var lines = [
        "10 def library fntest(&a,&b)",
        "20   let a = 10",
        "30   let b = 20",
        "40   let fntest = 30",
        "50 fnend"
      ]

      await fs.writeFile(tmpSource, lines.join(os.EOL), 'ascii')
      var compileResult = await tmp.compile(tmpSource, true, false)
      tmp.libs = [{
        path: `:${compileResult.binPath}`,
        fn: ["fntest"]
      }]

      var output = await tmp.fn("test", 1, 2)
      expect(output.results[0]).to.equal(10)
      expect(output.results[1]).to.equal(20)
      expect(output.return).to.equal(30)

      var lines = [
        "10 def library fntest$(&a$,&b$)",
        "20   let a$ = a$&'test1'",
        "30   let b$ = b$&'test2'",
        "40   let fntest$ = 'test return'",
        "50 fnend"
      ]

      await fs.writeFile(tmpSource, lines.join(os.EOL), 'ascii')
      var compileResult = await tmp.compile(tmpSource, true, false)
      tmp.libs = [{
        path: `:${compileResult.binPath}`,
        fn: ["fntest$"]
      }]

      var output = await tmp.fn("test$", "in1", "in2")
      expect(output.results[0]).to.equal("in1test1")
      expect(output.results[1]).to.equal("in2test2")
      expect(output.return).to.equal('test return')

    })

    // describe("Load", function(){
    //   it("should load a br program into memory", async function(){
    //     var result = await tmp.load()
    //   })
    // })

    // describe("Compile", function(){
    //   it("should create a compiled br binary from source code text", async function(){
    //     var source = `
    //       let a = 1
    //       let b = 2
    //       print a + b
    //       `
    //     var bin = await tmp.compile(source)
    //     console.log(bin);
    //     var loadResult = await tmp.proc([
    //       `load ${bin}`,
    //       `list`
    //     ])
    //   })
    // })
  })

  describe("Handle errors", function(){
    it("Should catch custom error on line 20 error number 4", async function(){
      await tmp.proc([
        "10 dim a$*1",
        "20 let a$ = 'xx'",
      ])

      try {
        var output = await tmp.cmd("run")
      } catch(err){
        expect(err.line).to.equal(20)
        expect(err.error).to.equal(4)
      }
    })
  })

})

describe('BrProcess', function() {

  const br = new BrProcess()

  before(async function() {
    await br.start()
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

  describe("Stop process", function(){
    it("Should notify us when a process has ended.", async function(){
      var result = await new Promise((res)=>{
        br.on('close', function(){
          res("ended")
        })
        br.stop()
      })
      expect(result).to.equal('ended')
    })
  })

});
