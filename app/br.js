const BrProcess = require('./run.js')
const queue = require('p-queue')

class Br extends BrProcess {
  constructor(...args){
    super(...args)
  }
  fn(fn,...args){
    var dims = []
    var argList = []
    for (var arg in args) {
      if (args.hasOwnProperty(arg)) {
        switch (typeof args[arg]) {
          case "string":
            dims.push(`arg${arg}$*${args[arg].length}`)
            argList.push(`arg${arg}$`)
            break;
          case "number":
            dims.push(`arg${arg}`)
            argList.push(`arg${arg}`)
            break;
          case "object":
            var stringCount = 0
            var numCount = 0
            var maxLen = 0
            for (var i = 0; i < args[arg].length; i++) {
              switch (typeof args[arg][i]) {
                case "string":
                  stringCount++
                  maxLen = Math.max(args[arg][i].length,maxLen)
                  break;
                case "number":
                  numCount++
                  break;
                default:
                  console.log("Invalid type [Object]")
              }
            }
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

    var call = `let fn${fn}(${argList.join(",")})`

    console.log(`dims:`);
    console.log(dims);
    console.log(`args:`);
    console.log(argList);
    console.log(`call:`);
    console.log(call);

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
