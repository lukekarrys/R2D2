import { EventEmitter } from 'events'
import net from 'net'

const REGEX_KV_LINE = /(.+?):\s*(.*)/
const EOL = '\r\n'
const ID_KEY = 'actionid'

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
  #buffer = []
  #pendingActions = {}
  #start = null

  #username = null
  #password = null

  #debug = null

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
        this.removeListener('connect', onConnect)
        reject(err)
      }
      this.once('connect', onConnect)
      this.once('error', onError)
    })
  }

  async disconnect() {
    await this.send({ action: 'Logoff' })
    this.#socket.end()
  }

  async send(options, { sync = false } = {}) {
    const id = Math.floor(Math.random() * 100000000)
    options[ID_KEY] = id

    const write = Object.entries(options).reduce((acc, [k, v]) => {
      const line = `${k}: ${v}`
      this.#debug('>>>', line)
      return (acc += `${line}${EOL}`)
    }, '')

    this.#debug('-'.repeat(20))

    const start = Date.now()
    this.#socket.write(write + EOL)

    this.#pendingActions[id] = { start }

    if (!sync) {
      return new Promise((res, rej) => {
        this.#pendingActions[id].resolve = res
        this.#pendingActions[id].reject = rej
      })
    }
  }

  #socketEnd(err) {
    this.#socket.unref()

    const actions = Object.entries(this.#pendingActions)
    const pActions = []

    for (const [k, v] of actions) {
      this.#debug(`PENDING ACTION: id=${k}`)
      this.#debug(`PENDING ACTION: elapsed=${Date.now() - v.start}`)
      this.#debug(`PENDING ACTION: promise=${!!v.resolve}`)
      if (v.reject) {
        v.reject(err ?? new Error('Socket closed'))
      }
    }

    if (err || pActions.length) {
      this.emit('error', err ?? new Error('Closed socket with pending actions'))
    }
  }

  async #socketStart(initial) {
    if (!initial.startsWith('Asterisk Call Manager/')) {
      throw new Error(`Unknown initial socket response: ${initial}`)
    }

    this.#socket.on('line', (line) => {
      if (line.length) {
        this.#debug('<<<', line)
        this.#buffer.push(line)
      } else {
        this.#processBuffer()
      }
    })

    await this.#login()
  }

  async #login() {
    try {
      const res = await this.send({
        action: 'Login',
        username: this.#username,
        secret: this.#password,
        events: 'on',
      })
      if (res.response !== 'Success') {
        this.#socketEnd()
        throw new Error(`Login failed: ${res.message}`)
      }
    } catch (err) {
      this.emit('error', err)
      return
    }

    this.emit('connect')
  }

  #processBuffer() {
    if (!this.#buffer.length) {
      return
    }

    const msg = this.#buffer
      .map((l) => l.match(REGEX_KV_LINE))
      .filter(Boolean)
      .map((match) => [match[1].toLowerCase(), match[2]])
      .reduce((acc, [k, v]) => ((acc[k] = v), acc), {})

    const action = this.#pendingActions[msg[ID_KEY]]
    if (action) {
      this.#debug('<<<', 'Elapsed:', Date.now() - action.start)
      this.#debug('<<<', 'Total Elapsed:', Date.now() - this.#start)
      action.resolve?.(msg)
      delete this.#pendingActions[msg[ID_KEY]]
    }

    this.#debug('-'.repeat(20))
    this.#buffer.length = 0
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
