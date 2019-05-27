const EventEmitter = require('events');
const { spawn } = require('child_process')
const process = require('process')
const pty = require('node-pty')
const fs = require('fs')
const os = require('os')
const queue = require('p-queue');

const REGEX_SHELL_ESCAPE = /(["\s'$`\\])/g
const REGEX_SIGNAL_READY = /READY/

const BRSIG = {
  "[24;80H": "LASTPOSITION",
  "[25H\n[24H[1L": "SCROLLUP",
  "[24H[1M[1H[1L": "SCROLLDN",
  "[25H[K": "CLEARSTATUS",
  "[24;80H[1J": "CLEAR",
  "[?7h": "INIT",
  "[H[J":"RESET",
  "016": "GRAPHICS_ON",
  "017": "GRAPHICS_OFF",
  "[?25h": "CURSOR_ON",
  "[?25l": "CURSOR_OFF",
  "018547": "ATTRIBUTE",
  "0426153715": "COLOR",
  "[@": "INSERT_CHAR",
  "[P": "DELETE_CHAR",
  "0008": "BACKSPACE",
  "[D": "LEFTARROW",
  "[C": "RIGHTARROW",
  "[A": "PRIORFIELD",
  "[B": "NEXTFIELD",
  "[2~": "INSERT",
  "[3~": "DELETE",
  "[1~": "HOME",
  "[4~": "ENDFIELD",
  "[5~": "PAGEUP",
  "[6~": "PAGEDOWN",
  "1b5b5b41": "F1",
  "1b5b5b42": "F2",
  "1b5b5b43": "F3",
  "1b5b5b44": "F4",
  "1b5b5b45": "F5",
  "1b5b31377e": "F6",
  "1b5b31387e": "F7",
  "1b5b31397e": "F8",
  "1b5b32307e": "F9",
  "1b5b32317e": "F10",
  "1b5b32337e": "F11",
  "1b5b32347e":"F12",
  "2b": "FIELDPLUS"
}

class BrProcess extends EventEmitter {
  constructor({
    log=0,
    filename="log.txt",
    // console=true,
    bin="",
    ...opt
  },...args){

    super()

    this.buffer = ""

    this.queue = new queue({
      concurrency:1
    })

    if (bin.length>0){
      this.bin = bin
    } else {
      this.bin = os.platform() === 'win32' ? 'br.exe' : 'brlinux'
    }

    if (log){
      this.openOutput(filename)
        .then((fd)=>{
          this.log = fd
          fs.write(this.log,"\r***********\rlog started\r***************\r",(err,written)=>{
            if (err){
              // console.log(`Could not open output file:`);
              throw err
            }
          })
        })
        .catch((err)=>{
          // console.log(`Could not open output file:`);
          throw err
        })
    } else {
      this.log = false
    }

    this.q = []
    this.idle = false

    this.ps = this.spawn(...args)

    this.starting = true

    this.on("ready",()=>{
      if (this.q.length){
        do {
          let cmd = this.q.shift()
          if (this.log){
            console.log(`\rcmd:${cmd}\r\n`)
          } else {
          }
          this.ps.write(`${cmd}\r\n`)
        } while (this.q.length);
        this.starting = false
      } else {
        this.idle = true
      }
    })

    this.ps.on('data',(buffer) => {
      // test for BR STATUS
      if (this.log){
        // fs.write(this.log,JSON.stringify(this.ps._socket,null,4),()=>{})
        // fs.write(this.log,`\r\nOutput:\r\n*************\r\n${buffer.toString()}\r\n**************\r\n`,()=>{})
      }
      if (REGEX_SIGNAL_READY.test(buffer) >= 1){
        fs.write(this.log,"\r\nprocess ready\r\n",()=>{})
        this.emit("ready","READY")
      } else {
        // if still in startup simulate enter key with line feed
        if (this.starting){
          this.ps.write("\r\n")
        } else {
          console.log(buffer.toString())
        }
      }
    })
  }

  getVersion(){
    return "4.32c"
    // ps.write()
  }

  openOutput(filename){
    return new Promise((resolve,reject)=>{
      fs.open(filename, 'w+', (err, fd) => {
        if (err) {
          reject(err);
          return
        }
        resolve(fd)
      });
    })
  }

  spawn(...args){
    return pty.spawn("./brlinux", args, {
      name: 'xterm',
      cols: 80,
      rows: 25,
      cwd: '/br',
      env: Object.assign(process.env, {
        TERM: "xterm"
      })
    })
  }

  startCmd(entrypoint="",...args){
    this.waitForReady()
    if (entrypoint){
      this.ps.write(`./${this.bin} \"${entrypoint}\" ${(args.length>1) ? [...args].concat(' ') : ''}` )
    } else {
      this.ps.write(`./${this.bin}`)
    }
  }

  sendCmd(brCmd){

    if (this.starting){
      this.q.push(brCmd)
    } else {
      this.ps.write(`${brCmd}\r\n`)
    }

    // if (this.idle){
    //   this.idle = false
    //   this.ps.write(`${this.q.shift()}\r\n`)
    // }
  }

  // escapeShell(cmd) {
  //   return '"'+cmd.replace(REGEX_SHELL_ESCAPE,'\\$1')+'"';
  // }
  //
  // onReady(){
  // }

  // waitForReady(){
  //   this.ps.once('data',(data) => {
  //     this.buffer += data
  //     if (REGEX_SIGNAL_READY.test(data) >= 1){
  //       this.onReady()
  //     } else {
  //       if (this.starting){
  //         this.ps.write("\n")
  //       }
  //       this.waitForReady()
  //     }
  //   })
  // }
}

module.exports = BrProcess
