const BrProcess = require('./run.js')
const path = require('path')
const fs = require('fs');
const os = require('os');
const fsPromises = fs.promises;
const { file } = require('tmp-promise');

class Br extends BrProcess {
  static async spawn(log=false, libs=[]){
    var br = new Br(log)
    await br.start()
    return br
  }
  _onReady(){
    for (var i = 0; i < this.libs.length; i++) {
      if (this.isSource(libs[i])){
        this.compile(libs[i])
      }
    }
  }
  _isSource(fileName){
    var ext = path.extname(filename)
    if (ext===".brs" || ext===".wbs"){
      return true
    } else {
      return false
    }
  }

  async compile(sourceCode){
    var lines = []
    var result = {
        err: null,
        path: null
    }

    if (typeof sourceCode === "object") {
      sourceCode = sourceCode.join(os.EOL)
    }

    const {fd, path, cleanup} = await file();
    await fsPromises.writeFile(path, sourceCode)

    try {
      await this.cmd(`load :${path},source`)
      await this.cmd(`save :${path}.br`)
      result.path = `${path}.br`
    } catch(err) {
      result.err = err
    } finally {
      await this.cmd('clear')
    }

    return result
  }

  getCompiledName(sourceFilename){
    var compiledName = ''
    switch (path.extname(sourceFilename)) {
      case '.wbs':
        compiledName = path.basename(sourceFilename,'.wbs')+'.wb'
        break;
      case '.brs':
        compiledName = path.basename(sourceFilename,'.brs')+'.br'
        break;
      default:
        compiledName = sourceFilename+'.br'
    }
    return compiledName
  }
  addLineNumbers(code){
    var lines = code.split("\r\n")
    if (lines[lines.length-1]===""){
      lines.pop()
    }
    for (var i = 0; i < lines.length; i++) {
      lines[i] = `${(i+1).toString().padStart(5,0)} ${lines[i]}`
    }
    return lines
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
  async set(name,val,idx){
    switch (typeof val) {
      case "string":
        return new Promise((resolve,reject)=>{
          this.sendCmd(`${name}$${idx!==undefined?`(${idx+1})`:``}="${val}" \r`).then((result)=>{
            // remove command line
            result.shift()
            // remove trailing whitespace
            result.unshift()
            resolve(result[0].substring(1))
          })
        })
        break;
      case "number":
        return new Promise((resolve,reject)=>{
          this.sendCmd(`${name}${idx!==undefined?`(${idx+1})`:``})=${val} \r`).then((result)=>{
            // remove command line
            result.shift()
            // remove trailing whitespace
            result.unshift()
            resolve(result[0].substring(1))
          })
        })
        break;
      case "object":
        var promises = []
        for (var i = 0; i < val.length; i++) {
          promises[i] = new Promise((resolve,reject)=>{
            this.set(name,val[i],i).then((data)=>{
              resolve(data)
            })
          })
        }
        return Promise.all(promises)
        break;
      default:
    }
  }

  async getVal(name,type,idx=false,size=10){
    switch (type) {
      case "string":
        return new Promise((resolve,reject)=>{
          this.sendCmd(`${name}$${idx?`(${idx})`:``} \r`).then((data)=>{
            // remove command line
            // data.shift()
            // remove trailing whitespace
            // data.unshift()
            resolve(data)
          })
        })
        break;
      case "number":
        return new Promise((resolve,reject)=>{
          this.sendCmd(`${name}${idx?`(${idx+1})`:``} \r`).then((data)=>{
            // remove command line
            data.shift()
            // remove trailing whitespace
            data.unshift()
            resolve(parseFloat(data[0]))
          })
        })
        break;
      case "stringarray":
        // wip
        var promises = []
        for (var i = 0; i < type.length; i++) {
          promises[i] = new Promise((resolve,reject)=>{
            this.getVal(name,'string',i).then((data)=>{
              resolve(data)
            })
          })
        }
        return Promise.all(promises)
        break;
      case "numberarray":
        // wip
        var promises = []
        var arr = []
        for (var i = 0; i < size; i++) {
          promises[i] = new Promise((resolve,reject)=>{
            this.getVal(name,'number',i).then((data)=>{
              resolve(data)
            })
          })
        }
        return Promise.all(promises)
        break;
      default:
    }
  }
}

module.exports=Br
