import type { EngineConfig } from '@engine'
import { messages } from './messages'

export const appConfig: EngineConfig = {
  appId: 'periodic-quiz',
  tablePrefix: 'periodic',
  appName: 'Periodic Quiz',
  messages,
}
