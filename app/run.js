// Copyright (c) 2019 Christopher Shields All Rights Reserved.
const EventEmitter = require('events');
const pty = require('node-pty')
const fs = require('fs')
const os = require('os')
const queue = require('p-queue');
const AnsiParser = require('node-ansiparser');
const chalk = require('chalk');

const PROMPT_FOR_KEYPRESS = /Press any key to continue ..../

const ANSI_TEXT_ATTRIBUTES = []
ANSI_TEXT_ATTRIBUTES[0] = 'All attributes off'
ANSI_TEXT_ATTRIBUTES[1] = 'Bold on'
ANSI_TEXT_ATTRIBUTES[4] = 'Underscore'
ANSI_TEXT_ATTRIBUTES[5] = 'Blink on'
ANSI_TEXT_ATTRIBUTES[7] = 'Reverse video on'
ANSI_TEXT_ATTRIBUTES[8] = 'Conceled on'

const ANSI_FOREGROUND_COLORS = []
ANSI_FOREGROUND_COLORS[30] = 'Black'
ANSI_FOREGROUND_COLORS[31] = 'Red'
ANSI_FOREGROUND_COLORS[32] = 'Green'
ANSI_FOREGROUND_COLORS[33] = 'Yellow'
ANSI_FOREGROUND_COLORS[34] = 'Blue'
ANSI_FOREGROUND_COLORS[35] = 'Magenta'
ANSI_FOREGROUND_COLORS[36] = 'Cyan'
ANSI_FOREGROUND_COLORS[37] = 'White'

const ANSI_BACKGROUND_COLORS = []
ANSI_BACKGROUND_COLORS[40] = chalk.red('Black')
ANSI_BACKGROUND_COLORS[41] = 'Red'
ANSI_BACKGROUND_COLORS[42] = 'Green'
ANSI_BACKGROUND_COLORS[43] = 'Yellow'
ANSI_BACKGROUND_COLORS[44] = 'Blue'
ANSI_BACKGROUND_COLORS[45] = 'Magenta'
ANSI_BACKGROUND_COLORS[46] = 'Cyan'
ANSI_BACKGROUND_COLORS[47] = 'White'

// DEC Private Mode Reset (DECRST)
// These are codes used to hide and show terminal components like the
// cursor and mouse clicks.  BR uses them the hide and show the cursor.
const XTERM_DECRST = []
XTERM_DECRST[25] = 'Hide Cursor (DECTCEM)'

const XTERM_DECSET = []
XTERM_DECSET[25] = 'Show Cursor (DECTCEM)'

class BrProcess extends EventEmitter {
  constructor({
    log=0,
    filename="log.txt",
    // console=true,
    bin="",
    entrypoint='',
    ...opt
  },...args){

    super()

    this.prompted = false;

    this.queue = new queue({
      concurrency:1
    })

    this.commandQueue = new queue({
      concurrency:1
    })

    this.brConfig = {
      rows: 25,
      cols: 80
    }

    this.q = []
    this.idle = false
    this.ready = false
    this.jobs = []
    this.line = ""
    this.lines = []
    this.license = ""

    this.on("print",this._handlePrint)
    // this.on("print",this._handlePrint)

    this.on("cursor",this._handleCSI)

    // ansi keycode event handlers
    this._startLog(log, filename)
      .then((log)=>{
        this.log = log
        return this.spawnBr(...args)
      })
      .then((ps,parser)=>{
        // console.log("ready")
        this.ps = ps
        this.parser = new AnsiParser(this.terminal)

        this.ps.on('data',(data)=>{
          this.parser.parse(data)
        })

        // drain existing command queue
        // if (this.q.length){
        //   do {
        //     let cmd = this.q.shift()
        //     if (this.log){
        //       // console.log(`\rcmd:${cmd}\r\n`)
        //     }
        //     this.write(`${cmd}`)
        //   } while (this.q.length);
        // }

        // this.ready = true
        // this.emit("onload")
      })

      this.shows = 0
  }

  _handlePrint(s) {
    console.log(`print: ${s}`)

    // if last row
    if (this.row===this.brConfig.rows) {
      // update status from statusline
      switch (this.column) {
        case 1:
          // seven
          this.state = s
          break;
        case 8:
          // one char
          break;
        case 9:
          // 29
          break;
        case 38:
          // one
          break;
        case 39:
          // four
          this.error = parseInt(s)
          break;
        case 44:
          // line
          this.lineNum = parseInt(s.substring(0,5))
          this.clause = parseInt(s.substring(6))
          break;
        case 53:
          // eight
          break;
        case 62:
          break;
        case 75:
          this.version = s
          // eight
          break;
        default:
          console.log(`uncaught column:${this.column}`);
      }
    } else {
      if (this.ready){
        this.line = [this.line.padEnd(this.column).slice(0, this.column), s, this.line.slice(this.column + s.length)].join("")
      } else {
        this.license+=s
      }
    }
  }

  _handleCSI(collected, params, flag){
    console.log("Device Control String (DCS):")
    switch (collected) {
      case '?':
        switch (flag) {
          case 'l':
            console.log(`  DEC Private Mode Reset (DECRST): ${XTERM_DECRST[params[0]]}`)
            // this.shows=0
            // this.running
            // this.grid[this.row][this.col]
            break;
          case 'h':
            this.shows+=1
            console.log(`  DEC Private Mode Set (DECSET): ${XTERM_DECSET[params[0]]}`)
            console.log(`  Shows: ${this.shows}`)

            //remove command line
            // this.lines.shift()
            // this.lines.shift()

            // finish job
            if (!this.ready) {
              this.ready = true
              this.emit("ready",this.license)
            } else {
              var job = this.jobs.shift()
              this.lines.push(this.line)
              this.line = ""
              job.cb(this.lines)
              this.lines = []
              // } else {
              //   this.emit("ready",this.lines.join("\n"))
              //   this.lines = []
              // }
            }

//            this.grid[this.row][this.col]
            break;
          default:
        }
        break;

      case '':
        switch (flag) {
          case 'm':
            console.log('  Graphics Mode:')
            console.log(`    Text Attribute: ${ANSI_TEXT_ATTRIBUTES[params[0]]}`)
            console.log(`    Foreground Color: ${ANSI_FOREGROUND_COLORS[params[1]]}`)
            console.log(`    Background Color: ${ANSI_BACKGROUND_COLORS[params[2]]}`)
            break
          case 'H':
            this.row=Math.max(1,params[0])
            this.column = params.length>1 ? params[1] : 1

            console.log('  Cursor Position:')
            console.log(`    Row/Col: ${this.row}/${this.column}`)
            break
          case 'L':
            console.log('  Insert Ps Line(s) (default = 1) (IL):')
            console.log(`    Lines: ${params.toString()}`)
            break
          case 'S':
            console.log('  Scroll up Ps lines (default = 1) (SU):')
            console.log(`    Lines: ${params.toString()}`)
            this.lines.push(this.line)
            this.line = ""
            break
          default:
            console.log(`  Unhandled flag: ${flag}`)
        }
        break;

      default:
        console.log(`unhandled collection: ${collected}`)
    }
  }

  get terminal(){
    return {
      inst_p: (s)=>{
        this.emit("print",s)
        this.writeLog('print', s)
      },
      inst_o: (s)=>{
        this.emit('osc', s)
        this.writeLog('osc', s)
      },
      inst_x: (flag)=>{
        this.emit("execute", flag.charCodeAt(0))
        this.writeLog('execute', flag.charCodeAt(0))
      },
      inst_c: (collected, params, flag)=>{
        this.emit("cursor", collected, params, flag)
        this.writeLog('csi', collected, params, flag)
      },
      inst_e: (collected, flag)=>{
        this.emit("escape", collected, flag)
        this.writeLog('esc', collected, flag)
      },
      inst_H: (collected, params, flag)=>{
        this.emit('dcs-Hook', collected, params, flag)
        this.writeLog('dcs-Hook', collected, params, flag)
      },
      inst_P: (dcs)=>{
        this.emit('dcs-Put', dcs)
        this.writeLog('dcs-Put', dcs)
      },
      inst_U: ()=>{
        this.emit('dcs-Unhook')
        this.writeLog('dcs-Unhook')
      }
    }
  }

  _startLog(log, filename){
    return new Promise((resolve,reject)=>{
      if (log){
        fs.open(filename, 'w+', (err, fd) => {
          if (err) {
            reject(err)
            return
          }
          fs.write(fd,"\r***********\rlog started\r***************\r",(err)=>{
            if (err) {
              reject(err)
              return
            }
            resolve(fd)
          })
        });
      } else {
        resolve(false)
      }
    })
  }

  getVersion(){
    return "4.32c"
  }

  getVal(variable,val){

  }

  setVal(variable,val){
    this.sendCmd(`${variable}=${val}\r`)
  }

  callFn(func,...args){
    for (var i = 0; i < args.length; i++) {
      if (typeof args[i] === 'string'){
        args[i] = `"${args[i]}"`
      }
    }
    var call = `let ${func}(${args.toString()})`
    this.sendCmd(call)
  }

  spawnBr(...args){
    return new Promise((resolve,reject)=>{
      // create psuedoterminal
      var ps = pty.spawn("./brlinux", args, {
        name: 'xterm',
        cols: this.brConfig.cols,
        rows: this.brConfig.rows,
        cwd: '/br',
        env: {
          TERM: "xterm"
        }
      })

      var license = ""

      // check for initial load screen and simulate enter
      ps.on('data',(s) => {
        license+=s
        if (PROMPT_FOR_KEYPRESS.test(s)){
          // ps.removeListener('data',loadListen)
          ps.write("\n")
          resolve(ps)
        }
      })
    })
  }

  async writeLog(...args){
    await this.queue.add(()=>{
      return new Promise((resolve,reject)=>{
        fs.write(this.log,`\r\n${JSON.stringify(args)}\r\n`,(err)=>{
          if (err) reject(err)
          resolve()
        })
      })
    })
  }

  write(cmd, cb){
    this.jobs.push({
      cmd: cmd,
      cb: cb
    })
    this.ps.write(cmd)
  }

  async sendCmd(brCmd){
    // if (this.ready){
    return await this.commandQueue.add(()=>{
      return new Promise((resolve,reject)=>{
        this.write(brCmd, (result)=>{
          resolve(result)
        })
      })
    })
  }
}

module.exports = BrProcess
