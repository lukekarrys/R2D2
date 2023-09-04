import { createServer } from 'http'
import { readFile, writeFile } from 'fs/promises'
import call from './call.mjs'
import r2d2 from './ascii.mjs'

const writeManagerEnv = async () => {
  const MANAGER_CONF = '/etc/asterisk/manager.conf'
  const { ADMIN_USER, ADMIN_SECRET } = process.env
  const conf = await readFile(MANAGER_CONF, 'utf-8')
  if (conf.includes('ADMIN_') && ADMIN_USER && ADMIN_SECRET) {
    await writeFile(
      MANAGER_CONF,
      conf
        .replace(/\{ADMIN_USER\}/g, ADMIN_USER)
        .replace(/\{ADMIN_SECRET\}/g, ADMIN_SECRET)
    )
  }
}

const getParams = async (req) => {
  const buffers = []
  for await (const chunk of req) {
    buffers.push(chunk)
  }
  return new URLSearchParams(Buffer.concat(buffers).toString())
}

const handler = async (req, res) => {
  const params = await getParams(req)

  res.setHeader('Content-Type', 'text/plain')

  if (req.method === 'POST' && req.url === '/call') {
    try {
      await call({
        host: params.get('host'),
        username: params.get('username'),
        password: params.get('password'),
        debug: params.get('debug'),
        hours: [9, 18],
      })
      res.end(r2d2(false))
    } catch (err) {
      res.writeHead(500).end(err.message)
    }
    return
  }

  if (req.method === 'GET' && req.url === '/r2d2') {
    return res.end(r2d2(false))
  }

  res.writeHead(404).end('Not found')
}

await writeManagerEnv()
const server = createServer(handler)
await new Promise((res) => server.listen(8000, res))
console.error('Server listening...')
