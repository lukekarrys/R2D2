import AMI from './ami.mjs'

const call = async ({ host, username, password }) => {
  const ami = new AMI({
    host,
    username,
    password,
  })

  await ami.connect()

  await ami.send(
    {
      Action: 'Originate',
      Channel: 'SIP/r2d2',
      Context: 'internal',
      Priority: '1',
      Exten: 's',
      Timeout: 1,
    },
    { sync: true }
  )

  await ami.send({
    Action: 'Hangup',
  })

  await ami.disconnect()

  return true
}

// const debounceCall = async (...args) => {
//   const p = call(...args)
// }

// const debounce = (func, timeout = 10000) => {
//   let timer
//   return (...args) => {
//     if (!timer) {
//       func(...args)
//       timer = setTimeout(() => (timer = null), timeout)
//     }
//     clearTimeout(timer)
//   }
// }

export default call
