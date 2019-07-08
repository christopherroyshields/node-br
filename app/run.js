// Copyright (c) 2019 Christopher Shields All Rights Reserved.
const EventEmitter = require('events');
const pty = require('node-pty')
const fs = require('fs')
const os = require('os')
const {default: PQueue} = require('p-queue');
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
    libs=[],
    ...opt
  },...args){

    super()

    this.prompted = false;

    this.queue = new PQueue({
      concurrency:1
    })

    this.commandQueue = new PQueue({
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
    this.config_messages = []
    this.license_text = []
    this.copyright = []
    this.serial = ""
    this.licensee = ""
    this.licensee_address = []
    this.stations = null
    this.concurrency = null
    this.wsid = null
    this.splashed = false

    this.shows = 0
    // ansi keycode event handlers
    this._startLog(log, filename)
      .then((log)=>{
        this.log = log
        return this.spawnBr(...args)
      })
      .then(({ps, license})=>{
        this.ps = ps
        this.license = license
        // console.log("ready")
        this.emit("ready",this.license)
      })

  }
  _handleError(){
    // converts BR error to Javascript Exception
    // May want to expand to have more br error info
    throw {
      name: "BR Error",
      message: `
      Error Number: ${this.error}
      Line: ${this.lineNum}
      Clause: ${this.clause}
      `
    }
  }
  _handlePrint(s) {
    console.log(`print: ${s}`)

    // if last row
    switch (this.row) {
      case 4:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.copyright[0] = s
            }
            break;
          default:
        }
        break
      case 5:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.copyright[1] = s
            }
            break;
          default:
        }
        break

      case 8:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.serial = parseInt(s.split(" ")[1])
            }
            break;
          default:
        }
        break;
      case 9:
        switch (this.column) {
          case 26:
            this.licensee = s
            break;
          default:
        }
        break;
      case 10:
        switch (this.column) {
          case 11:
            this.licensee_address[0] = s
            break;
          default:
        }
        break;
      case 11:
        switch (this.column) {
          case 11:
            this.licensee_address[1] = s
            break;
          default:
        }
        break;
      case 12:
        switch (this.column) {
          case 11:
            this.licensee_address[2] = s
            break;
          default:
        }
        break;
      case 14:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 15:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 16:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 17:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 23:
        // if still loading config messages are print on line 23
        switch (this.column) {
          case 1:
            if (this.shows===0){
              if (this.license_text.length){
                // if loading and after license info
                if (s.substring(0,15)==="Workstation ID:"){
                  this.wsid = parseInt(s.substring(16))
                }
              } else {
                // if loading and before license message
                this.config_messages.push(s)
              }
            }
            break;
          default:
        }
        break

      case 24:
        switch (this.column) {
          case 1:
            if (s.substring(0,24)==="Stations on the network:") {
              this.stations = parseInt(s.substring(25))
            }
            if (s.substring(0,25)==="Maximum Concurrent Users:") {
              this.concurrency = parseInt(s.substring(26))
            }
            if (s==="Press any key to continue ....") {
              this.splashed = true
            }
            break;
          default:
        }
        break;

      case this.brConfig.rows:
        // this handles printing to last line which is the statusline
        switch (this.column) {
          case 1:
            // seven
            this.state = s
            if (this.state==="ERROR  "){
              this._handleError()
            }
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
        break;
      default:
      this.line = [this.line.padEnd(this.column).slice(0, this.column), s, this.line.slice(this.column + s.length)].join("")
    }
  }

  _handleCSI(collected, params, flag){
    console.log("Device Control String (DCS):")
    switch (collected) {
      case '?':
        switch (flag) {
          case 'l':
            console.log(`  DEC Private Mode Reset (DECRST):`)
            // this.shows=0
            // this.running
            // this.grid[this.row][this.col]
            switch (params[0]) {
              case 25:
                console.log(`    Hide Cursor (DECTCEM)`)
                return "DECTCEM"
                break;
              default:
                console.log(`Uncaught Private Mode Reset: ${params[0]}`)
            }
            break;
          case 'h':
            console.log(`  DEC Private Mode Set (DECSET)`)
            switch (params[0]) {
              case 7:
                console.log(`    Auto-wrap Mode (DECAWM), VT100.`)
                return "DECAWM"
                break
              case 25:
                console.log(`    Show Cursor (DECTCEM)`)
                this.shows+=1
                console.log(`    Shows: ${this.shows}`)
                // this.lines.shift()

                // finish job
                this.lines.push(this.line.substring(1))
                this.line = ""
                if (this.jobs.length){
                  var job = this.jobs.shift()
                  job.cb(this.lines)
                  this.lines = []
                }
                return "DECTCEM"
                break;
              default:
                console.log(`Uncaught Private Mode Set: ${params[0]}`)
            }

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
          case 'J':
            console.log(`  Erase in Display (ED), VT100.`)
            switch (params[0]) {
              case 1:
                console.log(`    Erase Above.`)
                break;
              default:

            }
          case 'K':
            console.log(`Erase in Line (EL), VT100.`)
            switch (params[0]) {
              case 0:
                console.log(`  Erase to Right (default).`)
                break;
              default:
              console.log(`Uncaught EL: ${params[0]}`)
            }
            break
          case 'L':
            console.log('  Insert Ps Line(s) (default = 1) (IL):')
            switch (params[0]) {
              case 0:
              case 1:
                console.log(`    Lines: ${1}`)
                break;
              default:
                console.log(`    Lines: ${params[0]}`)
            }
            break
          case 'S':
            console.log('  Scroll up Ps lines (default = 1) (SU):')
            switch (params[0]) {
              case 0:
              case 1:
                console.log(`    Lines: ${1}`)
                break;
              default:
                console.log(`    Lines: ${params[0]}`)
            }
            console.log(`    Lines: ${params.toString()}`)
            this.lines.push(this.line.substring(1))
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

      this.ready = false

      this.parser = new AnsiParser({
        inst_p: (s)=>{
          if (!this.ready && !this.splashed){
            if (PROMPT_FOR_KEYPRESS.test(s)){
              // ps.removeListener('data',loadListen)
              ps.write("\n")
            }
            this._handlePrint(s)
          } else if (this.splashed && !this.rea) {
          } else {
          }
          this.writeLog('print', s)
        },
        inst_o: (s)=>{
          this.emit('osc', s)
          this.writeLog('osc', s)
        },
        inst_x: (flag)=>{
          // Single character method
          switch (flag) {
            case 10:
              console.log("Line Feed")
              this.lines.push("\n")
              break;
            case 13:
              console.log("Carriage Return")
              this.lines.push("\r")
              break;
            case 15:
              console.log("Shift In.")
              break
            default:

          }
          this.writeLog('execute', flag.charCodeAt(0))
        },
        inst_c: (collected, params, flag)=>{
          var cursorChange = this._handleCSI(collected, params, flag)
          if (this.shows===1 && cursorChange==="DECTCEM"){
            console.log(this.lines)
            license = this.lines.join("\r\n")
            this.lines = []
            resolve({ps, license})
          }
          // this.emit("cursor", collected, params, flag)
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
      })

      // check for initial load screen and simulate enter
      ps.on('data',(data)=>{
        this.parser.parse(data)
      })
      // ps.on('data',(s) => {
      // })
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
