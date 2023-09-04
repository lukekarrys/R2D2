import AMI from './ami.mjs'

const getNow = () =>
  new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Phoenix' }))

const call = async ({ host, username, password, debug: _debug, allow }) => {
  const debug = _debug ? console.error : () => {}

  if (allow) {
    const {
      days: [dayStart, dayEnd],
      hours: [hourStart, hourEnd],
    } = allow
    const now = getNow()

    debug(`Hours days${dayStart}-${dayEnd} hours:${hourStart}-${hourEnd}`)
    debug(`Now: ${now}`)

    const nowHours = now.getHours()
    const nowDay = now.getDay()

    if (
      nowHours < hourStart ||
      nowHours > hourEnd ||
      nowDay < dayStart ||
      nowDay > dayEnd
    ) {
      debug('Do not disturb due to `allow`')
      return
    }
  }

  const ami = new AMI({
    host, // host IP of server running asterisk
    username, // set in asterisk/manager.conf
    password, // set in asterisk/manager.conf
    debug,
  })

  await ami.connect()

  // set in asterisk/extensions.conf
  const channel = 'SIP/r2d2'
  const ext = '1234'
  const ctx = 'internal'

  await ami.send(
    {
      Action: 'Originate',
      Channel: channel,
      Exten: ext,
      Context: ctx,
      Priority: '1',
      Async: true,
    },
    { success: 'Event-DialBegin' }
  )

  await ami.send({
    Action: 'Hangup',
    Channel: `/^${channel}-.*/`,
    Exten: ext,
    Context: ctx,
  })

  await ami.disconnect()
}

export default call
