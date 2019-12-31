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
        "save testlib",
        "clear"
      ])

      tmp.libs = {
        "testlib":["fntest"]
      }

      var output = await tmp.fn("test", 1, 2)
      await tmp.cmd("free testlib.br")
      expect(output.results[0]).to.equal(10)
      expect(output.results[1]).to.equal(20)
      expect(output.return).to.equal(30)

      await tmp.proc([
        "10 def library fntest$(&a$,&b$)",
        "20   let a$ = a$&'test1'",
        "30   let b$ = b$&'test2'",
        "40   let fntest$ = 'test return'",
        "50 fnend",
        "save testlib",
        "clear"
      ])

      tmp.libs = {
        "testlib":["fntest$"]
      }

      var output = await tmp.fn("test$", "in1", "in2")
      await tmp.cmd("free testlib.br")
      expect(output.results[0]).to.equal("in1test1")
      expect(output.results[1]).to.equal("in2test2")
      expect(output.return).to.equal('test return')

    })
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
