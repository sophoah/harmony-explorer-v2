import zerg from 'zerg'
import {TLogMessage} from 'zerg/dist/types'
import {getExtendedData} from './utils'
import {consoleNodeColorful} from 'zerg/dist/transports'
import {config} from 'src/config'

function handler(logMessage: TLogMessage) {
  const message = logMessage.message

  const args: any[] = [message]
  const extendedData = getExtendedData(logMessage)

  if (extendedData) {
    args.push(extendedData)
  }

  return logMessage
}

const transportToConsole = zerg.createListener({
  handler: (...args) => consoleNodeColorful(handler(...args)),
  levels: config.logger.levels.console,
})

export default transportToConsole
