// Copyright (c) 2019 Christopher Shields All Rights Reserved.
const EventEmitter = require('events');
const pty = require('node-pty')
const fs = require('fs')
const os = require('os')
const AnsiParser = require('node-ansiparser');
const chalk = require('chalk');
const tmp = require('tmp-promise');

const PROMT_TO_END = /Press any key to exit./
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

class BrError extends Error {
  constructor({error,line,clause,message,command,output}){

    super(`BR Error ${error} occured
    on line ${line}, clause ${clause}
    with message '${message}'
    executing command '${command}'`)

    this.error = error
    this.line = line
    this.clause = clause
    this.command = command
    this.output = output

    Error.captureStackTrace(this, BrError)
  }
}

class BrProcess extends EventEmitter {
  constructor(log=false) {
    super()
    this.prompted = false;

    this.brConfig = {
      rows: 25,
      cols: 80
    }

    this.log = log
    this.started = false
    this.line = ""
    this.lines = []
    this.license = {
      license_text: [],
      licensee: "",
      licensee_address: []
    }
    this.config_messages = []
    this.copyright = []
    this.serial = ""
    this.stations = null
    this.concurrency = null
    this.wsid = null
    this.splashed = false
    this.programName = ""
    this.message = ""
    this.load_errors = []

    this.shows = 0

    this.parser = new AnsiParser({
      inst_p: this._onPrint.bind(this),
      inst_o: this._onOperatingSystemCommand.bind(this),
      inst_x: this._onSingleCharacterExecute.bind(this),
      inst_c: this._onCursorChange.bind(this),
      inst_e: (collected, flag)=>{
        if (this.log) console.log('esc', collected, flag)
      },
      inst_H: (collected, params, flag)=>{
        if (this.log) console.log('dcs-Hook', collected, params, flag)
      },
      inst_P: (dcs)=>{
        if (this.log) console.log('dcs-Put', dcs)
      },
      inst_U: ()=>{
        if (this.log) console.log('dcs-Unhook')
      }
    })
  }

  async start(){
    try {
      await this._spawnBr()
      this.started = true
      if (this.log) console.log("started")
      this.emit("ready")
    } catch(err){
      console.error(err);
    }
  }

  async stop(){
    try {
      await this.proc([
        'clear',
        'system'
      ])
    } catch(err){
      console.error(err);
    }
  }

  // enter lines of code and run then return results
  async proc(lines){
    var output = []
    for (var i = 0; i < lines.length; i++) {
      output.push(await this.cmd(`${lines[i]}`))
    }
    return output
  }

  async cmd(cmd){
    var output = await this._write(`${cmd}\r`)
    if (this.error){
      var err = this._handleError(cmd, output)
      await this._write("\n")
      this.error = 0
      throw err
    } else {
      return output
    }
  }

  _write(cmd){
    return new Promise((resolve, reject)=>{
      this.ps.write(cmd)
      this.once("done", (data)=>{
        resolve(data)
      })
    })
  }

  async _spawnBr(){
    await new Promise((resolve, reject)=>{
      // create psuedoterminal
      this.ps = pty.spawn("./brlinux", [], {
        name: 'linux',
        cols: this.brConfig.cols,
        rows: this.brConfig.rows,
        cwd: '../br',
        env: {
          TERM: "linux"
        }
      })

      var license = ""

      this.once("started", ()=>{
        resolve()
      })

      this.ps.on('data',(data)=>{
        this.parser.parse(data)
      })

      this.ps.on('close', (code, sig)=>{
        this.emit('close')
      })
    })
  }

  _onPrint(text){

    if (this.log) console.log('print', `*${text}*`)

    if (this.row===this.brConfig.rows){
      this._parseStatusLine(text)
    } else {
      if (!this.splashed){
        if (PROMT_TO_END.test(text)){
          this.ps.write("\n")
          this.emit("load_error",this.load_errors)
        } else if (PROMPT_FOR_KEYPRESS.test(text)){
          // ps.removeListener('data',loadListen)
          this.ps.write("\n")
          this.splashed = true
        } else {
          this._parseLoadingText(text)
        }
      } else if (this.started) {
        this._parseOutput(text)
      }
    }
  }

  _onCursorChange(collected, params, flag) {
    var cursorChange = this._handleCSI(collected, params, flag)
    // if (this.log) console.log(cursorChange)
    if (cursorChange==="DECTCEM"){
      if (!this.started && this.splashed){
        if (this.log) console.log("STARTED")
        this.started = true
        this.emit("started")
      }
    }
    // this.emit("cursor", collected, params, flag)
    // if (this.log) console.log('csi', collected, params, flag)
  }

  _onOperatingSystemCommand(s) {
    if (this.log) console.log('Operating System Command (osc)', s)
  }

  _onSingleCharacterExecute(flag) {
    // Single character method
    if (this.started){
      switch (flag.charCodeAt(0)) {
        case 10:
          if (this.log) console.log("Line Feed")
          this.lines.push(this.line)
          this.line=""
          break;
        case 13:
          if (this.log) console.log("Carriage Return")
          // this.lines.push("\r")
          break;
        case 15:
          if (this.log) console.log("Shift In.")
          break
        default:
        if (this.log) console.log('unhadled single character execute', flag.charCodeAt(0))
      }
    }
  }

  _parseOutput(s){
    this.line = [this.line.padEnd(this.column).slice(0, this.column), s, this.line.slice(this.column + s.length)].join("")
  }

  _handleError(cmd, output){
    // converts BR error to Javascript Exception
    // May want to expand to have more br error info
    var err = new BrError({
      name: "BR Error",
      message: this.message,
      error: this.error,
      line: this.lineNum,
      clause: this.clause,
      command: cmd,
      output: output
    })

    return err
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
            this.license.licensee = s
            break;
          default:
        }
        break;
      case 10:
        switch (this.column) {
          case 11:
            this.license.licensee_address[0] = s
            break;
          default:
        }
        break;
      case 11:
        switch (this.column) {
          case 11:
            this.license.licensee_address[1] = s
            break;
          default:
        }
        break;
      case 12:
        switch (this.column) {
          case 11:
            this.license.licensee_address[2] = s
            break;
          default:
        }
        break;
      case 14:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 15:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 16:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 17:
        switch (this.column) {
          case 7:
            if (this.shows===0){
              this.license.license_text.push(s)
            }
            break;
          default:
        }
        break

      case 21:
        switch (this.column) {
          case 1:
            this.load_errors.push(s)
            break;
          default:
        }

      case 22:
        switch (this.column) {
          case 1:
            this.load_errors.push(s)
            break;
          default:
        }


      case 23:
        // if still loading config messages are print on line 23
        switch (this.column) {
          case 1:
            if (this.shows===0){
              if (this.license.license_text.length){
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
          case 80:
            this.load_errors.push(s)
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
        this.state = s.trim()
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
        if (s.trim()!==""){
          this.lineNum = parseInt(s.substring(0,5))
          this.clause = parseInt(s.substring(6))
        } else {
          this.lineNum = 0
          this.clause = 0
        }
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
                this.last_command = this.line
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

                // if (this.state === "ERROR"){
                //   debugger
                // }
                // this.lines.shift()

                // finish job
                if (this.started){
                  this.lines.push(this.line.substring(1))
                  this.line = ""
                    // job.cb(this.lines)
                  this.emit("done", this.lines)
                  this.lines = []
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

}

module.exports = BrProcess
