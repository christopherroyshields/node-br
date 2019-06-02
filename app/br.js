const BrProcess = require('./run.js')
const queue = require('p-queue')

class Br extends BrProcess {
  constructor(...args){
    super(...args)
    this.commandQueue = new queue({
      concurrency:1
    })
  }
  async set(name,val,idx){
    switch (typeof val) {
      case "string":
        return await this.commandQueue.add(()=>{
          return ps.sendCmd(`${name}$${idx!==undefined?`(${idx+1})`:``}="${val}"\r`)
        })
        break;
      case "number":
        return await this.commandQueue.add(()=>{
          new Promise((resolve,reject)=>{
            ps.sendCmd(`${name}${idx!==undefined?`(${idx+1})`:``}=${val}\r`).then((result)=>{
               resolve(result)
            })
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

  async getVal(name,type,idx,size=10){
    switch (type) {
      case "string":
        return await this.commandQueue.add(()=>{
          return new Promise((resolve,reject)=>{
            return ps.sendCmd(`print ${name}$${idx!==undefined?`(${idx})`:``}\r`).then((data)=>{
              // remove command line
              data.shift()
              // remove trailing whitespace
              data.unshift()
              resolve(data[0])
            })
          })
        })
        break;
      case "number":
        return await this.commandQueue.add(()=>{
          return new Promise((resolve,reject)=>{
            return ps.sendCmd(`${name}${idx!==undefined?`(${idx+1})`:``}\r`).then((data)=>{
              // remove command line
              data.shift()
              // remove trailing whitespace
              data.unshift()
              resolve(parseFloat(data[0]))
            })
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
