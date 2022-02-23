const BrProcess = require('./run.js')
const path = require('path')
const fs = require('fs').promises
const exists = require('fs').existsSync
const os = require('os');
const { tmpNameSync } = require('tmp-promise');
const HAS_LINE_NUMBERS = /^\s*\d{0,5}\s/
const LAST_LINE_SEARCH = /\r?\n?\s*(\d+).*\r?\n?$/

class Br extends BrProcess {

  static async spawn(log=false, libs=[]){
    var br = new Br(log)
    await br.start()
    return br
  }

  async applyLexi(sourcePath, outPath= "", mapPath = "", addLineNumbers = true){

    this.libs = [{
      path: ":/br/lexi.br",
      fn: ["fnApplyLexi"]
    }]

    if (outPath.length === 0){
      outPath = `${sourcePath}.out`
    }

    if (mapPath.length === 0){
      mapPath = `${sourcePath}.map`
    }

    try {
      await this.fn("ApplyLexi", `:${sourcePath}`, `:${outPath}`, addLineNumbers ? 0 : 1, `:${mapPath}`)
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
      bin: null,
      binPath: null
    }

    var outPath = `${sourcePath}.out`
    var mapPath = `${sourcePath}.map`

    if (applyLexi){
      try {
        await this.applyLexi(sourcePath, outPath, mapPath, addLineNumbers)
      } catch (err) {
        console.log("Error applying Lexi.")
        result.err = err
        return result;
      }
    }

    let
      bin = null,
      part = null,
      e = null

    await this.queue.add(async ()=>{
      try {
        await this.cmd(`load :${outPath},source`)
        var res
        try {
          bin = path.join(path.dirname(outPath), path.basename(outPath, path.extname(outPath)) + ".br")
          if (exists(bin)) {
            await this.cmd(`replace :${bin}`)
          } else {
            await this.cmd(`save :${bin}`)
          }
        } catch(err){
          e = err
        }
      } catch(err) {
        e = err
        try {
          part = path.join(path.dirname(outPath), path.basename(outPath, path.extname(outPath)) + ".part")
          await this.cmd(`list >:${part}`)
        } catch(err) {
          console.log("error listing partial")
        }
      } finally {
        try {
          await this.cmd('clear')
        } catch(err){
          console.log("error clearing")
        }
      }
    })

    if (bin){
      result.binPath = bin
      result.bin = await fs.readFile(bin)
    }

    if (e){
      result.err = e
      if (part){
        let partialText = await fs.readFile(`${part}`, 'ascii')
        let lastGoodLineNumber = (LAST_LINE_SEARCH.exec(partialText)[1]).toString()

        if (addLineNumbers){
          let sourceMapText = await fs.readFile(mapPath, 'ascii')

          let rangeSearch = new RegExp(`\\n${lastGoodLineNumber},\\d+\\n(\\d+),(\\d+)`)

          let range = rangeSearch.exec(sourceMapText)[1]
          let rangeStart = rangeSearch.exec(sourceMapText)[2]

          let rangeEndSearch = new RegExp(`\\n${range},(\\d+)(\\r?\\n$|(?!\\r?\\n${range}))`)
          let rangeEnd = rangeEndSearch.exec(sourceMapText)[1]

          result.err.line = range
          result.err.sourceLine = rangeStart
          result.err.sourceLineEnd = rangeEnd
        } else {
          result.err.line = lastGoodLineNumber

          let sourceFileText = await fs.readFile(sourcePath, 'ascii')
          let lastLineSearch = new RegExp(`(^|\\r?\\n)[\\t\\s]*${lastGoodLineNumber}`)
          let lastLineMatch = sourceFileText.match(lastLineSearch)
          let lastLineIndex = lastLineMatch.index + lastLineMatch[0].length

          let nextLineMatch = sourceFileText.substring(lastLineIndex).match(/\r?\n[\t\s]*\d+/)
          let nextLineIndex = nextLineMatch.index + nextLineMatch[0].length + lastLineIndex

          result.err.sourceLine = sourceFileText.substring(0, nextLineIndex).split("\n").length

          let endLineMatch = sourceFileText.substring(nextLineIndex).match(/(\r?\n[\t\s]*\d+|$)/)
          let endLineIndex = endLineMatch.index + endLineMatch[0].length + nextLineIndex

          result.err.sourceLineEnd = sourceFileText.substring(0, endLineIndex).split("\n").length - 1
        }
      } else {
        result.err.sourceLine = 1
      }
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
