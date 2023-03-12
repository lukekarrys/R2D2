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

export default call
