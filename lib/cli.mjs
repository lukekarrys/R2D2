#!/usr/bin/env node

import { parseArgs } from 'node:util'
import call from './call.mjs'
import r2d2 from './ascii.mjs'

const { values } = parseArgs({
  args: process.argv.slice(2),
  options: {
    host: {
      type: 'string',
      short: 'h',
    },
    username: {
      type: 'string',
      short: 'u',
    },
    password: {
      type: 'string',
      short: 'p',
    },
  },
})

call(values)
  .then(() => console.error(r2d2))
  .catch((err) => {
    console.error(err)
    process.exitCode = 1
  })
