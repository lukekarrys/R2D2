import { EventEmitter } from 'events'
import net from 'net'

const REGEX_KV_LINE = /(.+?):\s*(.*)/
const EOL = '\r\n'

class LineSocket extends net.Socket {
  #port = null
  #host = null

  constructor({ port, host }) {
    super()

    this.#port = port
    this.#host = host

    let buffer = ''

    this.setTimeout(3000)

    this.on('timeout', () => {
      this.emit(
        'error',
        new Error(`connect ETIMEDOUT ${this.#host}:${this.#port}`)
      )
      this.end()
    })

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
  #pendingActions = {}

  #username = null
  #password = null

  constructor({ port = 5038, host = 'localhost', username, password }) {
    super()
    this.#socket = new LineSocket({ port, host })
    this.#username = username
    this.#password = password
  }

  async connect() {
    this.#socket.once('line', (line) => this.#onFirstLine(line))
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
    options.actionid = Math.floor(Math.random() * 100000000)

    this.#socket.write(
      Object.entries(options).reduce(
        (acc, [k, v]) => (acc += `${k}: ${v}${EOL}`),
        ''
      ) + EOL
    )

    if (!sync) {
      return new Promise((resolve, reject) => {
        this.#pendingActions[options.actionid] = { resolve, reject }
      }).finally(() => {
        delete this.#pendingActions[options.actionid]
      })
    }
  }

  #socketEnd(err) {
    this.#socket.unref()

    const actions = Object.entries(this.#pendingActions)

    if (err) {
      for (const [, action] of actions) {
        action.reject(err)
      }
      this.emit('error', err)
      return
    }

    if (actions.length) {
      const ids = actions.map((a) => a[0])
      this.emit(
        'error',
        new Error(`Closed socket with pending actions: ${ids.join()} `)
      )
    }
  }

  async #onFirstLine() {
    const buffer = []
    this.#socket.on('line', (line) => {
      if (!line.length) {
        if (buffer.length) {
          this.#processMessage(buffer)
        }
        buffer.length = 0
      } else {
        buffer.push(line)
      }
    })

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

  #processMessage(rawMsg) {
    const msg = rawMsg
      .map((l) => l.match(REGEX_KV_LINE))
      .filter(Boolean)
      .map((match) => [match[1].toLowerCase(), match[2]])
      .reduce((acc, [k, v]) => {
        acc[k] = v
        return acc
      }, {})

    this.#pendingActions[msg.actionid]?.resolve(msg)
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
