const BrProcess = require('./run.js')

class Br extends BrProcess {
  set(name,val,idx){
    switch (typeof val) {
      case "string":
        return ps.sendCmd(`let ${name}$${idx!==undefined?`(${idx})`:``}="${val}"`)
        break;
      case "number":
        return ps.sendCmd(`let ${name}${idx!==undefined?`(${idx})`:``}=${val}`)
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
  getVal(name,type){
    switch (type) {
      case "string":
        return ps.sendCmd(`print ${name}$`)
        break;
      case "number":
        return new Promise((resolve)=>{
          ps.sendCmd(`print ${name}`).then((data)=>{
            resolve(parseFloat(data))
          })
        })
        break;
      case "object":
        var promises = []
        for (var i = 0; i < type.length; i++) {
          promises[i] = new Promise((resolve,reject)=>{
            this.set(name,type[i],i).then((data)=>{
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

// ps.sendCmd(`DIR`)
// ps.sendCmd(`ST ST`)
// ps.sendCmd(`PRINT "TEST"`).then((response)=>{
//   console.log(`response: ${response}`)
// })

// ps.sendCmd("\033[24;1HD\033[24;2HI\033[24;3HR\n")
// ps.sendCmd("SY stty -echo")
// ps.sendCmd("\033[?25l")
// ps.sendCmd(`10 library "switch.br":fnmylib\r`)
// ps.sendCmd(`30 let fnmylib\r`)
// ps.sendCmd("RUN\r")
// ps.sendCmd("\033[?25h")
// ps.sendCmd(Buffer.from([0x9B,0x3F,0x32,0x35,0x68]))
