const BrProcess = require('./run.js')
const path = require('path')
const fs = require('fs');
const os = require('os');
const { tmpNameSync } = require('tmp-promise');
const HAS_LINE_NUMBERS = /^\s*\d{0,5}\s/

const {default: PQueue} = require('p-queue');
const queue = new PQueue({concurrency: 1});

class Br extends BrProcess {

  static async spawn(log=false, libs=[]){
    var br = new Br(log)
    await br.start()
    return br
  }

  async applyLexi(lines){

    this.libs = [{
      path: ":/br/lexi.br",
      fn: ["fnApplyLexi"]
    }]

    var dontAddLines = HAS_LINE_NUMBERS.test(lines[0]) ? 1 : 0

    try {
      const tmpPath = await tmpNameSync()
      fs.writeFileSync(tmpPath, lines.join(os.EOL))
      await this.fn("ApplyLexi", `:${tmpPath}`, `:${tmpPath}.out`, dontAddLines, `:${tmpPath}.sourcemap`)
      var output = fs.readFileSync(`${tmpPath}.out`, 'ascii')
      var sourceMap = fs.readFileSync(`${tmpPath}.sourcemap`, 'ascii')
    } catch(err){
      throw new Error("Error applying Lexi\n" + err)
    }

    return {
      lines: output.split(os.EOL),
      sourceMap: sourceMap
    }

  }

  async decompile(buf){
    var lines = []
    const path = await tmpNameSync();
    fs.writeFileSync(`${path}.br`, buf)
    try {
      await this.cmd(`list <:${path}.br >:${path}.brs`)
    } catch(err){
      throw err
    }
    var source = fs.readFileSync(`${path}.brs`, 'ascii')
    lines = source.split('\r\n')
    return lines
  }

  async compile(lines, applyLexi = true){
    var result = {
      err: null,
      path: null,
      bin: null
    }

    var sourceMap = ""
    try {
      if (applyLexi){
        var { lines, sourceMap } = await this.applyLexi(lines)
      }

      let tmpName = await tmpNameSync()
      fs.writeFileSync(`${tmpName}`, lines.join(os.EOL))
      await this.cmd(`load :${tmpName},source`)

      try {
        await this.cmd(`save :${tmpName}.br`)
      } catch(err){
        result.err = err
      } finally {
        result.path = `${tmpName}.br`
        result.bin = fs.readFileSync(`${tmpName}.br`)
      }

    } catch(err) {
      result.err = err
      try {
        let tmpName = await tmpNameSync()
        await this.cmd(`list >:${tmpName}.part`)
        result.err.sourceLine = fs.readFileSync(`${tmpName}.part`, 'ascii').split(os.EOL).length
        await this.cmd(`free :${tmpName}.part`)
      } catch(e) {
        result.err.sourceLine = 1
      }
    } finally {
      await this.cmd('clear')
    }

    return result
  }

  async fn(fn,...args){

    var dims = []
    var argList = []
    var setList = []
    var getList = []
    getList.push(`print "{"`)
    getList.push(`print '"results":['`)
    for (var arg in args) {
      if (args.hasOwnProperty(arg)) {
        switch (typeof args[arg]) {
          case "string":
            dims.push(`arg${arg}$*${Math.max(1024,args[arg].length)}`)
            argList.push(`arg${arg}$`)
            setList.push(`arg${arg}$="${args[arg]}"`)
            getList.push(`print '"'&arg${arg}$&'"'`)
            break;
          case "number":
            dims.push(`arg${arg}`)
            argList.push(`arg${arg}`)
            setList.push(`arg${arg}=${args[arg]}`)
            getList.push(`print str$(arg${arg})`)
            break;
          case "object":
            var stringCount = 0
            var numCount = 0
            var maxLen = 0
            getList.push(`print "["`)
            getList.push(`for i = 1 to udim(arg${arg}$) !: print '"'&arg${arg}$(i)&'"' !: if i<udim(arg${arg}$) then print "," !: next i`)
            getList.push(`if udim(arg${arg}$) and udim(arg${arg}$) then print ","`)
            getList.push(`for i = 1 to udim(arg${arg}) !: print str$(arg${arg}(i)) !: if i<udim(arg${arg}) then print "," !: next i`)
            getList.push(`print "]"`)
            for (var i = 0; i < args[arg].length; i++) {
              switch (typeof args[arg][i]) {
                case "string":
                  stringCount++
                  maxLen = Math.max(args[arg][i].length,maxLen)
                  setList.push(`arg${arg}$(${stringCount})="${args[arg][i]}"`)
                  break;
                case "number":
                  numCount++
                  setList.push(`arg${arg}(${numCount})=${args[arg][i]}`)
                  break;
                default:
                  console.log("Invalid type [Object]")
              }
            }
            if (stringCount){
              dims.push(`arg${arg}$(${stringCount})*${Math.max(maxLen,1024)}`)
              argList.push(`mat arg${arg}$`)
            }
            if (numCount){
              dims.push(`arg${arg}(${stringCount})`)
              argList.push(`mat arg${arg}`)
            }
            break;
          default:
        }
      }
      if (arg<args.length-1){
        getList.push(`print ","`)
      }
    }
    getList.push(`print "],"`)

    if (fn.includes('$')){
      dims.push(`result$*2048`)
      getList.push(`print '"return":"'&result$&'"'`)
    } else {
      getList.push(`print '"return":'&str$(result)`)
    }

    getList.push(`print "}"`)


    var codeLines = []
    do {
      codeLines.push(`DIM ${dims.splice(0,6).join(",")}`)
    } while (dims.length)

    for (const lib of this.libs) {
      codeLines.push(`LIBRARY "${lib.path}": ${lib.fn.join(",")}`)
    }

    do {
      codeLines.push(`LET ${setList.shift()}`)
    } while (setList.length)

    codeLines.push(`LET result${fn.includes('$') ? "$" : ""}=fn${fn}(${argList.join(",")})`)

    do {
      codeLines.push(`${getList.shift()}`)
    } while (getList.length)

    var withLineNums = ''

    var commands = []
    for (var i = 0; i < codeLines.length; i++) {
      // console.log(`${(i+1).toString().padStart(5,0)} ${codeLines[i]}\r`)
      commands.push(`${(i+1).toString().padStart(5,0)} ${codeLines[i]}`)
      if (i===codeLines.length-1){
        commands.push(`${(i+2).toString().padStart(5,0)} stop`)
      }
    }

    var output = ""
    var json = {}

    await this.proc(commands)

    try {
      output = await this.cmd("run")
      json = JSON.parse(output.splice(1).join(''))
    } catch(err){
      console.error(err);
    } finally {
      await this.cmd("clear")
    }

    return json

  }
}

module.exports=Br
