import { EventEmitter } from 'events'
import net from 'net'

const REGEX_KV_LINE = /(.+?):\s*(.*)/
const EOL = '\r\n'
const ID_KEY = 'ActionID'
const SUCCESS_KEY = '_SuccessEvent'
const AUTH_EVENT = 'Event-SuccessfulAuth'

class LineSocket extends net.Socket {
  #port = null
  #host = null

  constructor({ port, host }) {
    super()

    this.#port = port
    this.#host = host

    let buffer = ''

    this.on('data', (chunk) => {
      buffer += chunk
      const r = buffer.split(EOL)
      while (r.length > 1) {
        const cur = r.shift()
        this.emit('line', cur)
      }
      buffer = r.shift()
    })

    this.on('end', () => {
      if (buffer.length) {
        this.emit('line', buffer)
      }
    })
  }

  connect() {
    return super.connect({
      port: this.#port,
      host: this.#host,
      noDelay: true,
      keepAlive: true,
      keepAliveInitialDelay: 30000,
    })
  }
}

class AMI extends EventEmitter {
  #socket = null
  #buffer = {}
  #pendingActions = {}
  #start = null

  #username = null
  #password = null

  #debug = null

  get #emptyBuffer() {
    return Object.keys(this.#buffer).length === 0
  }

  constructor({ port = 5038, host = 'localhost', username, password, debug }) {
    super()
    this.#socket = new LineSocket({ port, host })
    this.#username = username
    this.#password = password
    this.#debug = debug ? console.error : () => {}
  }

  async connect() {
    this.#start = Date.now()

    this.#socket.once('line', (line) => this.#socketStart(line))
    this.#socket.on('error', (err) => this.#socketEnd(err))
    this.#socket.on('end', () => this.#socketEnd())
    this.#socket.connect()

    await new Promise((resolve, reject) => {
      const onConnect = () => {
        this.removeListener('error', onError)
        resolve()
      }
      const onError = (err) => {
        this.removeListener(AUTH_EVENT, onConnect)
        reject(err)
      }
      this.once(AUTH_EVENT, onConnect)
      this.once('error', onError)
    })
  }

  async disconnect() {
    await this.send({ action: 'Logoff' })
    this.#socket.end()
  }

  async send(options, { success } = {}) {
    const id = Math.floor(Math.random() * 100000000)
    options[ID_KEY] = id
    if (success) {
      options[SUCCESS_KEY] = success
    }

    const write = Object.entries(options).reduce((acc, [k, v]) => {
      const line = `${k}: ${v}`
      this.#debug('>>>', line)
      return (acc += `${line}${EOL}`)
    }, '')

    this.#debug('-'.repeat(20))

    const start = Date.now()
    this.#socket.write(write + EOL)

    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(
        () =>
          reject(
            new Error(`Timeout on sent event: ${JSON.stringify(options)}`)
          ),
        3000
      )
      this.#pendingActions[success ?? id] = {
        start,
        resolve: (arg) => (clearTimeout(timeoutId), resolve(arg)),
        reject: (err) => (clearTimeout(timeoutId), reject(err)),
      }
    })
  }

  #socketEnd(err) {
    this.#socket.unref()

    const actions = Object.entries(this.#pendingActions)

    for (const [k, v] of actions) {
      this.#debug(`PENDING ACTION: id=${k}`)
      this.#debug(`PENDING ACTION: elapsed=${Date.now() - v.start}`)
      v.reject(err ?? new Error('Socket closed'))
    }

    if (err || actions.length) {
      this.emit('error', err ?? new Error('Closed socket with pending actions'))
    }
  }

  async #socketStart(initial) {
    this.#debug(initial)

    if (!initial.startsWith('Asterisk Call Manager/')) {
      throw new Error(`Unknown initial socket response: ${initial}`)
    }

    this.#socket.on('line', (line) => {
      if (line.length) {
        this.#debug('<<<', line)
        const [, k, v] = line.match(REGEX_KV_LINE) || []
        if (k) {
          if (this.#emptyBuffer) {
            const eventId = `${k}-${v}`
            this.emit(eventId)
            this.#buffer[SUCCESS_KEY] = eventId
          }
          this.#buffer[k] = v
        }
      } else {
        this.#processBuffer()
        this.#buffer = {}
      }
    })

    await this.#login()
  }

  async #login() {
    try {
      const res = await this.send({
        Action: 'Login',
        Username: this.#username,
        Secret: this.#password,
        Events: 'on',
      })
      if (res.Response !== 'Success') {
        this.#socketEnd()
        throw new Error(`Login failed: ${res.message}`)
      }
    } catch (err) {
      this.emit('error', err)
      return
    }
  }

  #processBuffer() {
    if (this.#emptyBuffer) {
      return
    }

    const id = this.#buffer[ID_KEY]
    const eventId = this.#buffer[SUCCESS_KEY]
    const action = this.#pendingActions[id] ?? this.#pendingActions[eventId]

    if (action) {
      this.#debug('<<<', 'Elapsed:', Date.now() - action.start)
      action.resolve(this.#buffer)
      delete this.#pendingActions[id]
      delete this.#pendingActions[eventId]
    }

    this.#debug('<<<', 'TotalElapsed:', Date.now() - this.#start)
    this.#debug('-'.repeat(20))
  }
}

export default AMI

/*

The above code was copied and modified from: github.com/ipoddubny/ya-node-asterisk 

Copyright (c) Ivan Poddubny

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

*/
