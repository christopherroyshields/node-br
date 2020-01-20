const {expect} = require('chai')
const BrProcess = require('./run.js')
const Br = require('./br.js');

describe("Br class for high level abstraction", function() {
  var tmp = {}
  var tmp2 = {}
  before(async function(){
    tmp = await Br.spawn()
    tmp2 = await Br.spawn()
  })

  after(async function(){
    await tmp.stop()
    await tmp2.stop()
  })

  describe("applyLexi", function() {
    it("Should should preprocess br code", async function(){
      var lines = [
        'let a = 1',
        'let b = 2'
      ]

      var { lines, sourceMap } = await tmp.applyLexi(lines)

      expect(lines[0]).to.equal('00001 let a = 1')
      expect(lines[1]).to.equal('00002 let b = 2')
    })
  })

  describe("Process Factory", function() {
    it("Should spawn a br process", async function(){
      expect(tmp.wsid>0).to.equal(true)
      expect(tmp2.wsid>0).to.equal(true)
    })
  })

  describe("Compile", function(){
    it("Should create a br program from source", async function(){

      var { err, path } = await tmp.compile([
        `10 let a = 1`,
        `20 let b = "a"`
      ])

      expect(err.error).to.equal(1026)
      expect(err.sourceLine).to.equal(2)

      var { err, path } = await tmp2.compile([
        `10 let a = 1`,
        `20 let b = "a"`
      ])

      expect(err.error).to.equal(1026)
      expect(err.sourceLine).to.equal(2)

      var { err, path } = await tmp.compile([
        `10 let a = 1`,
        `20 let b = fntest`
      ])

      expect(err.error).to.equal(302)
      // expect(err.output[0]).to.equal(` save :${path}`)
      expect(err.output[1]).to.equal(" FNTEST")

      var { err, path, bin } = await tmp.compile([
        `10 let a = 1`
      ])

      var list = await tmp.cmd(`list <:${path}`)


      expect(err).to.equal(null)
      expect(path.length>0).to.equal(true)
      expect(list[1]).to.equal(" 00010 LET A = 1 ")


    })
  })

  describe("De-compile", function(){
    it("Should return array of lines from buffer", async function(){
      var buf = Buffer.from("AAAAMwAAABQMJgOAAAAAAAChAAAAKAAAAEcAAAAcAAAAAgAAAGMAAAA+AAAABAEYAAAACQIAAQEBDQBBQAkCAgEDAQ0AQUAIAAAKAAAAAQAAAAIAAQgAABQAAAALAAAAFv/+AQFBAAAAAAAAAAAAAQAAIAAAAAAAAAA/8AAAAAAAAAEBQgAAAAAAAAAAAAEAACAAAAAAAAAAQAAAAAAAAAAAFAEwMDAxMAEBBQVBID0gMQA2cgAUATAwMDIwAQEFBUIgPSAyAAoA", 'base64')
      var lines = await tmp.decompile(buf)
      expect(lines[0]).to.equal("00010 LET A = 1")
      expect(lines[1]).to.equal("00020 LET B = 2")
    })
  })

  describe("Library Function", function() {
    it("Should call a library function", async function(){
      // create Library
      var lib = {}
      lib = await tmp.compile([
        "10 def library fntest(&a,&b)",
        "20   let a = 10",
        "30   let b = 20",
        "40   let fntest = 30",
        "50 fnend"
      ])

      tmp.libs = [{
        path: `:${lib.path}`,
        fn: ["fntest"]
      }]

      var output = await tmp.fn("test", 1, 2)
      await tmp.cmd(`free :${lib.path}`)
      expect(output.results[0]).to.equal(10)
      expect(output.results[1]).to.equal(20)
      expect(output.return).to.equal(30)

      lib = await tmp.compile([
        "10 def library fntest$(&a$,&b$)",
        "20   let a$ = a$&'test1'",
        "30   let b$ = b$&'test2'",
        "40   let fntest$ = 'test return'",
        "50 fnend"
      ])

      tmp.libs = [{
        path: `:${lib.path}`,
        fn: ["fntest$"]
      }]

      var output = await tmp.fn("test$", "in1", "in2")
      await tmp.cmd(`free :${lib.path}`)
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
