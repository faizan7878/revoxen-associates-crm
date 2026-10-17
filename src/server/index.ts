import { createApp } from './app.js'
import { openDatabase } from './db.js'

const database = openDatabase(process.env.DB_FILE)
const app = createApp(database)
const port = Number(process.env.API_PORT ?? 3001)
const server = app.listen(port, '127.0.0.1', () => {
  console.info(`Revoxen CRM API listening on http://127.0.0.1:${port}`)
  console.info(`SQLite database: ${process.env.DB_FILE ?? 'data/revoxen.sqlite'}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => {
    database.close()
    process.exit(0)
  }))
}
