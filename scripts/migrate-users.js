import { Pool } from 'pg'
import fs from 'fs'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    // Read old data
    const oldData = JSON.parse(fs.readFileSync('./db/data.json', 'utf8'))
    console.log(`Found ${oldData.users.length} users, ${oldData.profiles.length} profiles in old data`)

    // Migrate users
    for (const u of oldData.users) {
      await pool.query(
        `INSERT INTO users (id, "employeeId", "name", "role", "team", "passwordHash", "createdAt", "updatedAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
         ON CONFLICT ("employeeId") DO NOTHING`,
        [u.id, u.employeeId, u.name, u.role, u.team || null, u.passwordHash, u.createdAt || new Date().toISOString(), u.updatedAt || new Date().toISOString()]
      )
    }
    console.log(`✓ Migrated ${oldData.users.length} users`)

    // Migrate profiles
    for (const p of oldData.profiles) {
      await pool.query(
        `INSERT INTO profiles (id, "userId", "createdAt")
         VALUES ($1,$2,$3)
         ON CONFLICT (id) DO NOTHING`,
        [p.id, p.userId, p.createdAt || new Date().toISOString()]
      )
    }
    console.log(`✓ Migrated ${oldData.profiles.length} profiles`)

    // Verify
    const users = await pool.query('SELECT id, "employeeId", "name", "role", "team" FROM users ORDER BY "employeeId"')
    console.log('\nUsers in Neon:')
    users.rows.forEach(r => console.log(`  ${r.employeeId} | ${r.name} | ${r.role} | ${r.team || 'unassigned'}`))

    console.log('\n✅ Migration complete!')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
