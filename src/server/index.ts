import { createApp } from './app.js'
import { openDatabase } from './db.js'

const database = openDatabase(process.env.DB_FILE)
const app = createApp(database)
const port = Number(process.env.PORT ?? process.env.API_PORT ?? 3001)
const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1'
const server = app.listen(port, host, () => {
  console.info(`Revoxen CRM API listening on http://${host}:${port}`)
  console.info(`SQLite database: ${process.env.DB_FILE ?? 'data/revoxen.sqlite'}`)
})

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => server.close(() => {
    database.close()
    process.exit(0)
  }))
}
