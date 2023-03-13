import { createServer } from 'http'
import call from './call.mjs'
import r2d2 from './ascii.mjs'

const getParams = async (req) => {
  const buffers = []
  for await (const chunk of req) {
    buffers.push(chunk)
  }
  return new URLSearchParams(Buffer.concat(buffers).toString())
}

const debouncedCall = ((timeout) => {
  let CAN_CALL = true
  return async (...args) => {
    if (CAN_CALL) {
      await call(...args)
      CAN_CALL = false
      setTimeout(() => (CAN_CALL = true), timeout)
    }
  }
})(10 * 1000)

const handler = async (req, res) => {
  const params = await getParams(req)

  if (req.method === 'POST' && req.url === '/call') {
    try {
      await debouncedCall({
        host: params.get('host'),
        username: params.get('username'),
        password: params.get('password'),
      })
      res.end(r2d2)
    } catch (err) {
      res.writeHead(500).end(err.message)
    }
    return
  }

  res.writeHead(404).end('Not found')
}

const server = createServer(handler)
await new Promise((res) => server.listen(8000, res))
console.error('Server listening...')
