import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    // Check performance table schema
    const schema = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'performance' ORDER BY ordinal_position
    `)
    console.log('Performance schema:')
    schema.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))
    
    // Test insert
    const id = 'test_' + Date.now()
    const now = new Date().toISOString()
    await pool.query(
      `INSERT INTO performance (id, "userId", "team", "metric", "value", "date", "notes", "category", "status", "workDescription", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING *`,
      [id, 'test_user', 'rolo-edge', 'hpe', 5, '2026-10-29', '', 'project', 'pending', 'test description', now]
    )
    console.log('\n✅ Test insert with workDescription succeeded')
    
    // Clean up
    await pool.query('DELETE FROM performance WHERE id = $1', [id])
    console.log('✅ Test cleanup done')
    
  } catch (e) {
    console.error('❌ Error:', e.message)
    console.error(e.stack)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()