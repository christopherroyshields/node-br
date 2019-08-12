// Copyright (c) 2019 Christopher Shields All Rights Reserved.
const EventEmitter = require('events');
const pty = require('node-pty')
const fs = require('fs')
const os = require('os')
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

    this.brConfig = {
      rows: 25,
      cols: 80
    }

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
    this.programName = ""
    this.message = ""

    this.shows = 0
    // ansi keycode event handlers
    this.spawnBr(...args)
      .then(({ps, license})=>{
        this.ps = ps
        this.license = license
        if (this.log) console.log("ready")
        this.emit("ready",this.license)
      })
  }
  _handleError(){
    // converts BR error to Javascript Exception
    // May want to expand to have more br error info
    var err = {
      name: "BR Error",
      message: `
      Error Number: ${this.error}
      Line: ${this.lineNum}
      Clause: ${this.clause}
      Message: ${this.message}
      `
    }
    console.error(err)
    throw err
  }
  _parseLoadingText(s) {
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

      default:
    }
  }
  _parseStatusLine(s) {
    // if last row
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
        this.message = s
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
      case 49:
        // line
        this.programName = s
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
        if (this.log) console.log(`uncaught column:${this.column}`);
    }
  }

  _parseOutput(s){
    this.line = [this.line.padEnd(this.column).slice(0, this.column), s, this.line.slice(this.column + s.length)].join("")
  }

  _handleCSI(collected, params, flag){
    if (this.log) console.log("Device Control String (DCS):")
    switch (collected) {
      case '?':
        switch (flag) {
          case 'l':
            if (this.log) console.log(`  DEC Private Mode Reset (DECRST):`)
            // this.shows=0
            // this.running
            // this.grid[this.row][this.col]
            switch (params[0]) {
              case 25:
                if (this.log) console.log(`    Hide Cursor (DECTCEM)`)
                return "DECTCEM"
                break;
              default:
                if (this.log) console.log(`Uncaught Private Mode Reset: ${params[0]}`)
            }
            break;
          case 'h':
            if (this.log) console.log(`  DEC Private Mode Set (DECSET)`)
            switch (params[0]) {
              case 7:
                if (this.log) console.log(`    Auto-wrap Mode (DECAWM), VT100.`)
                return "DECAWM"
                break
              case 25:
                if (this.log) console.log(`    Show Cursor (DECTCEM)`)
                this.shows+=1
                if (this.log) console.log(`    Shows: ${this.shows}`)


                if (this.state==="ERROR  "){
                  this._handleError()
                }
                this.lines.shift()

                // finish job
                if (this.ready){
                  // this.lines.push(this.line.substring(1))
                  this.line = ""
                  if (this.jobs.length){
                    var job = this.jobs.shift()
                    job.cb(this.lines)
                    this.lines = []
                  }
                }
                return "DECTCEM"
                break;
              default:
                if (this.log) console.log(`Uncaught Private Mode Set: ${params[0]}`)
            }

            break;
          default:
        }
        break;

      case '':
        switch (flag) {
          case 'm':
            if (this.log) console.log(`  Graphics Mode:`)
            if (this.log) console.log(`    Text Attribute: ${ANSI_TEXT_ATTRIBUTES[params[0]]}`)
            if (this.log) console.log(`    Foreground Color: ${ANSI_FOREGROUND_COLORS[params[1]]}`)
            if (this.log) console.log(`    Background Color: ${ANSI_BACKGROUND_COLORS[params[2]]}`)
            break
          case 'H':
            this.row=Math.max(1,params[0])
            this.column = params.length>1 ? params[1] : 1

            if (this.log) console.log('  Cursor Position:')
            if (this.log) console.log(`    Row/Col: ${this.row}/${this.column}`)
            break
          case 'J':
            if (this.log) console.log(`  Erase in Display (ED), VT100.`)
            switch (params[0]) {
              case 1:
                if (this.log) console.log(`    Erase Above.`)
                break;
              default:

            }
          case 'K':
            if (this.log) console.log(`Erase in Line (EL), VT100.`)
            switch (params[0]) {
              case 0:
                if (this.log) console.log(`  Erase to Right (default).`)
                break;
              default:
              if (this.log) console.log(`Uncaught EL: ${params[0]}`)
            }
            break
          case 'L':
            if (this.log) console.log('  Insert Ps Line(s) (default = 1) (IL):')
            switch (params[0]) {
              case 0:
              case 1:
                if (this.log) console.log(`    Lines: ${1}`)
                break;
              default:
                if (this.log) console.log(`    Lines: ${params[0]}`)
            }
            break
          case 'S':
            if (this.log) console.log('  Scroll up Ps lines (default = 1) (SU):')
            switch (params[0]) {
              case 0:
              case 1:
                if (this.log) console.log(`    Lines: ${1}`)
                break;
              default:
                if (this.log) console.log(`    Lines: ${params[0]}`)
            }
            if (this.log) console.log(`    Lines: ${params.toString()}`)
            this.lines.push(this.line.substring(1))
            this.line = ""
            break
          default:
            if (this.log) console.log(`  Unhandled flag: ${flag}`)
        }
        break;

      default:
        if (this.log) console.log(`unhandled collection: ${collected}`)
    }
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
        cwd: '../br',
        env: {
          TERM: "xterm"
        }
      })

      var license = ""

      this.parser = new AnsiParser({
        inst_p: (s)=>{
          if (this.row===this.brConfig.rows){
            this._parseStatusLine(s)
          } else {
            if (!this.splashed){
              if (PROMPT_FOR_KEYPRESS.test(s)){
                // ps.removeListener('data',loadListen)
                ps.write("\n")
                this.splashed = true
              } else {
                this._parseLoadingText(s)
              }
            } else if (this.ready) {
              this._parseOutput(s)
            }
          }
          if (this.log) console.log('print', s)
        },
        inst_o: (s)=>{
          if (this.log) console.log('osc', s)
        },
        inst_x: (flag)=>{
          // Single character method
          if (this.ready){
            switch (flag) {
              case 10:
                if (this.log) console.log("Line Feed")
                this.lines.push("\n")
                break;
              case 13:
                if (this.log) console.log("Carriage Return")
                this.lines.push("\r")
                break;
              case 15:
                if (this.log) console.log("Shift In.")
                break
              default:
              if (this.log) console.log('unhadled single character execute', flag.charCodeAt(0))
            }
          }
        },
        inst_c: (collected, params, flag)=>{
          var cursorChange = this._handleCSI(collected, params, flag)
          // if (this.log) console.log(cursorChange)
          if (cursorChange==="DECTCEM"){
            if (!this.ready){
              if (this.log) console.log("READY")
              this.ready = true
              // this.emit("ready")
              resolve({ps, license})
            }
          }
          // this.emit("cursor", collected, params, flag)
          // if (this.log) console.log('csi', collected, params, flag)
        },
        inst_e: (collected, flag)=>{
          // this.emit("escape", collected, flag)
          if (this.log) console.log('esc', collected, flag)
        },
        inst_H: (collected, params, flag)=>{
          // this.emit('dcs-Hook', collected, params, flag)
          if (this.log) console.log('dcs-Hook', collected, params, flag)
        },
        inst_P: (dcs)=>{
          // this.emit('dcs-Put', dcs)
          if (this.log) console.log('dcs-Put', dcs)
        },
        inst_U: ()=>{
          // this.emit('dcs-Unhook')
          if (this.log) console.log('dcs-Unhook')
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

  write(cmd, cb){
    this.jobs.push({
      cmd: cmd,
      cb: cb
    })
    this.ps.write(cmd)
  }

  sendCmd(brCmd){
    return new Promise((resolve,reject)=>{
      this.write(brCmd, (result)=>{
        resolve(result)
      })
    })
  }
}

module.exports = BrProcess
