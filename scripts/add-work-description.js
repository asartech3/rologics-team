import { Pool } from 'pg'

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_NBcFIUmjL60a@ep-long-butterfly-aof7v2es-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: { rejectUnauthorized: false }
})

async function main() {
  try {
    // Add workDescription column to performance table
    await pool.query(`
      ALTER TABLE performance 
      ADD COLUMN IF NOT EXISTS "workDescription" TEXT DEFAULT ''
    `)
    console.log('✅ Added workDescription column to performance table')
    
    // Verify
    const schema = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'performance' ORDER BY ordinal_position
    `)
    console.log('\nPerformance schema:')
    schema.rows.forEach(r => console.log(`  ${r.column_name}: ${r.data_type}`))
    
  } catch (e) {
    console.error('❌ Error:', e.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()