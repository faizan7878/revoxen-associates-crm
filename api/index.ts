import { createApp } from '../src/server/app.js'
import { openDatabase } from '../src/server/db.js'

const database = openDatabase()
const app = createApp(database)

export default app
