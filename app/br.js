const BrProcess = require('./run.js')
const queue = require('p-queue')

class Br extends BrProcess {
  constructor(config){
    super({
      log:config.log
    })
    this.libs = config.libs
  }
  run(prog){

  }
  // registers
  fn(fn,lib,...args){
    var dims = []
    var argList = []
    var setList = []
    var getList = []
    getList.push(`"{"`)
    getList.push(`"results:["`)
    for (var arg in args) {
      if (args.hasOwnProperty(arg)) {
        switch (typeof args[arg]) {
          case "string":
            dims.push(`arg${arg}$*${args[arg].length}`)
            argList.push(`arg${arg}$`)
            setList.push(`arg${arg}$="${args[arg]}"`)
            getList.push(`arg${arg}$`)
            break;
          case "number":
            dims.push(`arg${arg}`)
            argList.push(`arg${arg}`)
            setList.push(`arg${arg}=${args[arg]}`)
            getList.push(`str$(arg${arg})`)
            break;
          case "object":
            var stringCount = 0
            var numCount = 0
            var maxLen = 0
            getList.push(`print "["`)
            for (var i = 0; i < args[arg].length; i++) {
              switch (typeof args[arg][i]) {
                case "string":
                  stringCount++
                  maxLen = Math.max(args[arg][i].length,maxLen)
                  setList.push(`arg${arg}$(${stringCount})="${args[arg][i]}"`)
                  getList.push(`str$(arg${arg}$(${stringCount}))`)
                  break;
                case "number":
                  numCount++
                  setList.push(`arg${arg}(${numCount})=${args[arg][i]}`)
                  getList.push(`arg${arg}(${numCount})`)
                  break;
                default:
                  console.log("Invalid type [Object]")
              }
              if (i<args[arg].length-1){
                getList.push(`","`)
              }
            }
            getList.push(`"]"`)
            if (stringCount){
              dims.push(`arg${arg}$(${stringCount})*${maxLen}`)
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
        getList.push(`","`)
      }
    }
    getList.push(`"]"`)
    getList.push(`"}"`)

    var codeLines = []
    do {
      codeLines.push(`DIM ${dims.splice(0,6).join(",")}`)
    } while (dims.length)

    for (var lib in this.libs) {
      codeLines.push(`LIBRARY "${lib}": ${this.libs[lib].join(",")}`)
    }

    do {
      codeLines.push(`LET ${setList.shift()}`)
    } while (setList.length)

    codeLines.push(`LET fn${fn}(${argList.join(",")})`)

    do {
      codeLines.push(`PRINT ${getList.shift()}`)
    } while (getList.length)

    // for (var i = 0; i < codeLines.length; i++) {
    //   this.sendCmd(`${i.toString()} ${codeLines[i]}\r`)
    // }

    // this.sendCmd("SAVE test\r")

    // console.log(`dims:`);
    // console.log(dims);
    // console.log(`args:`);
    // console.log(argList);
    // console.log(`call:`);
    // console.log(call);
    console.log(`code:`);
    console.log(codeLines);
    // console.log(`get:`);
    // console.log(getList);

  }
  async set(name,val,idx){
    switch (typeof val) {
      case "string":
        return new Promise((resolve,reject)=>{
          ps.sendCmd(`${name}$${idx!==undefined?`(${idx+1})`:``}="${val}" \r`).then((result)=>{
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
          ps.sendCmd(`${name}${idx!==undefined?`(${idx+1})`:``})=${val} \r`).then((result)=>{
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
          ps.sendCmd(`${name}$${idx?`(${idx})`:``} \r`).then((data)=>{
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
          ps.sendCmd(`${name}${idx?`(${idx+1})`:``} \r`).then((data)=>{
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
