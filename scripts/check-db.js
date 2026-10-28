import { Pool } from 'pg'

const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_NBcFIUmjL60a@ep-long-butterfly-aof7v2es-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require",
  ssl: { rejectUnauthorized: false }
})

async function main() {
  try {
    // Check all tables
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `)
    console.log('Tables:', tables.rows.map(r => r.table_name))
    
    // Check targets schema
    const targetsSchema = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'targets' ORDER BY ordinal_position
    `)
    console.log('\nTargets schema:', targetsSchema.rows)
    
    // Check performance schema
    const perfSchema = await pool.query(`
      SELECT column_name, data_type FROM information_schema.columns 
      WHERE table_name = 'performance' ORDER BY ordinal_position
    `)
    console.log('\nPerformance schema:', perfSchema.rows)
    
    // Check projects
    const projects = await pool.query('SELECT * FROM projects')
    console.log('\nProjects:', projects.rows.map(p => ({ name: p.name, slug: p.slug, team: p.team })))
    
  } catch (e) {
    console.error('Error:', e.message)
  } finally {
    await pool.end()
  }
}

main()