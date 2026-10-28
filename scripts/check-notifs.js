import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    const rows = await pool.query('SELECT id, "userIds", "readBy" FROM notifications LIMIT 5')
    console.log('Notifications rows:', rows.rows.length)
    rows.rows.forEach(r => {
      console.log('  id:', r.id)
      console.log('  userIds type:', typeof r.userIds, 'value:', JSON.stringify(r.userIds))
      console.log('  readBy type:', typeof r.readBy, 'value:', JSON.stringify(r.readBy))
    })
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}

main()
