const BrProcess = require('./run.js')
const queue = require('p-queue')

class Br extends BrProcess {
  constructor(...args){
    super(...args)
  }
  fn(fn,lib,...args){
    var dims = []
    var argList = []
    var setList = []
    var getList = []
    getList.push(`print "{"`)
    getList.push(`print "results:["`)
    for (var arg in args) {
      if (args.hasOwnProperty(arg)) {
        switch (typeof args[arg]) {
          case "string":
            dims.push(`arg${arg}$*${args[arg].length}`)
            argList.push(`arg${arg}$`)
            setList.push(`arg${arg}$="${args[arg]}"`)
            getList.push(`print arg${arg}$${arg<args.length?'&","':''}`)
            break;
          case "number":
            dims.push(`arg${arg}`)
            argList.push(`arg${arg}`)
            setList.push(`arg${arg}=${args[arg]}`)
            getList.push(`print str$(arg${arg})${arg<args.length?'&","':''}`)
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
                  getList.push(`print arg${arg}$(${stringCount})&${i+1<args[arg].length?'","':''}`)
                  break;
                case "number":
                  numCount++
                  setList.push(`arg${arg}(${numCount})=${args[arg][i]}`)
                  getList.push(`print str$(arg${arg}(${numCount}))&${i+1<args[arg].length?'","':''}`)
                  break;
                default:
                  console.log("Invalid type [Object]")
              }
            }
            console.log(arg+1)
            console.log(args.length)
            getList.push(`print "]${arg+1<args.length?',':''}"`)
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
    }
    getList.push(`print "]"`)
    getList.push(`print "}"`)

    var codeLines = []
    do {
      codeLines.push(`DIM ${dims.splice(0,6).join(",")}`)
    } while (dims.length)

    do {
      codeLines.push(`LET ${setList.shift()}`)
    } while (setList.length)

    codeLines.push(`LET fn${fn}(${argList.join(",")})`)

    // console.log(`dims:`);
    // console.log(dims);
    // console.log(`args:`);
    // console.log(argList);
    // console.log(`call:`);
    // console.log(call);
    // console.log(`code:`);
    // console.log(codeLines);
    console.log(`get:`);
    console.log(getList);

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
          ps.sendCmd(`${name}${idx!==undefined?`(${idx+1})`:``}=${val} \r`).then((result)=>{
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
