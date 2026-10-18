import { hashPassword } from './auth.js'
import { openDatabase } from './db.js'

type UserRow = {
  id: number
  name: string
  email: string
  role: string
  active: number
}

const db = openDatabase(process.env.DB_FILE)

const args = process.argv.slice(2)
const inputPassword = args[0]?.trim()
const targetEmail = args[1]?.trim().toLowerCase()

let user: UserRow | undefined

if (targetEmail) {
  user = db.prepare('SELECT id, name, email, role, active FROM users WHERE LOWER(email) = LOWER(?)').get(targetEmail) as UserRow | undefined
  if (!user) {
    console.error(`Error: User with email "${targetEmail}" was not found in the database.`)
    db.close()
    process.exit(1)
  }
} else {
  user = db.prepare("SELECT id, name, email, role, active FROM users WHERE role = 'admin' ORDER BY id ASC LIMIT 1").get() as UserRow | undefined
  if (!user) {
    user = db.prepare("SELECT id, name, email, role, active FROM users ORDER BY id ASC LIMIT 1").get() as UserRow | undefined
  }
}

if (!user) {
  console.error('Error: No users found in the database.')
  db.close()
  process.exit(1)
}

const newPassword = inputPassword || 'Admin@Revoxen2026'

if (newPassword.length < 10 || newPassword.length > 128) {
  console.error(`Error: Password length must be between 10 and 128 characters. Provided password length is ${newPassword.length}.`)
  db.close()
  process.exit(1)
}

const newHash = hashPassword(newPassword)

db.prepare('UPDATE users SET password_hash = ?, active = 1 WHERE id = ?').run(newHash, user.id)
db.prepare('DELETE FROM user_sessions WHERE user_id = ?').run(user.id)

console.info('====================================================')
console.info('  Revoxen CRM - Password Reset Successful')
console.info('====================================================')
console.info(`  Account Name : ${user.name}`)
console.info(`  Email / Login: ${user.email}`)
console.info(`  Role         : ${user.role}`)
console.info(`  New Password : ${newPassword}`)
console.info('====================================================')
console.info('All existing active sessions for this user have been cleared.')
console.info('You can now log in at http://localhost:5173')

db.close()
