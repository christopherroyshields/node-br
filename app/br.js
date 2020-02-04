const BrProcess = require('./run.js')
const path = require('path')
const fs = require('fs').promises
const os = require('os');
const { tmpNameSync } = require('tmp-promise');
const HAS_LINE_NUMBERS = /^\s*\d{0,5}\s/

class Br extends BrProcess {

  static async spawn(log=false, libs=[]){
    var br = new Br(log)
    await br.start()
    return br
  }

  async applyLexi(tmpPath, addLineNumbers = true){

    this.libs = [{
      path: ":/br/lexi.br",
      fn: ["fnApplyLexi"]
    }]

    let output = ""
    let sourceMap = ""
    try {
      await this.fn("ApplyLexi", `:${tmpPath}`, `:${tmpPath}.out`, addLineNumbers ? 0 : 1, `:${tmpPath}.sourcemap`)
      sourceMap = await fs.readFile(`${tmpPath}.sourcemap`, 'ascii')
    } catch(err){
      throw new Error("Error applying Lexi\n" + err)
    }
  }

  async decompile(binPath, sourcePath){
    try {
      await this.queue.add(async ()=>{
        await this.cmd(`list <:${binPath} >:${sourcePath}`)
      })
    } catch(err){
      throw err
    }
  }

  async compile(sourcePath, applyLexi = true, addLineNumbers = true){
    var result = {
      err: null,
      bin: null
    }

    let sourceMap = []

    if (applyLexi){
      try {
        await this.applyLexi(sourcePath, addLineNumbers)
        sourcePath = `${sourcePath}.out`
      } catch (err) {
        throw err
      }
    }

    let
      bin = null,
      part = null,
      e = null

    await this.queue.add(async ()=>{
      try {
        await this.cmd(`load :${sourcePath},source`)
        try {
          bin = `${sourcePath}.br`
          await this.cmd(`save :${bin}`)
        } catch(err){
          e = err
        }
      } catch(err) {
        e = err
        try {
          part = `${sourcePath}.part`
          await this.cmd(`list >:${part}`)
        } catch(err) {
          part = ``
        }
      } finally {
        await this.cmd('clear')
      }
    })

    if (bin){
      result.bin = await fs.readFile(`${sourcePath}.br`)
    }

    if (e){
      result.err = e
      if (part){
        let partData = await fs.readFile(`${part}`, 'ascii')
        result.err.sourceLine = partData.split(os.EOL).length
      } else {
        result.err.sourceLine = 1
      }
    }

    // fs.unlink(`${sourcePath}.br`)
    // fs.unlink(`${sourcePath}.part`)
    // fs.unlink(`${sourcePath}`)

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
    }
    commands.push("run")

    let output = []
    await this.queue.add(async ()=>{
      try {
        output = await this.proc(commands)
      } catch(err){
        throw err
      } finally {
        await this.cmd("clear")
      }
    })
    return JSON.parse(output[output.length-1].slice(1).join("").trim())
  }
}

module.exports=Br
