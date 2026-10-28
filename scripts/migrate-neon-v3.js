import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    // Drop existing tables
    await pool.query('DROP TABLE IF EXISTS notifications CASCADE')
    await pool.query('DROP TABLE IF EXISTS targets CASCADE')
    await pool.query('DROP TABLE IF EXISTS reports CASCADE')
    await pool.query('DROP TABLE IF EXISTS performance CASCADE')
    await pool.query('DROP TABLE IF EXISTS profiles CASCADE')
    await pool.query('DROP TABLE IF EXISTS users CASCADE')
    await pool.query('DROP TABLE IF EXISTS projects CASCADE')
    await pool.query('DROP TABLE IF EXISTS settings CASCADE')
    console.log('Dropped old tables')

    // Recreate with quoted column names to preserve camelCase
    await pool.query(`
      CREATE TABLE users (
        id TEXT PRIMARY KEY,
        "employeeId" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL,
        "team" TEXT,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ users table')

    await pool.query(`
      CREATE TABLE profiles (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ profiles table')

    await pool.query(`
      CREATE TABLE performance (
        id TEXT PRIMARY KEY,
        "userId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        "team" TEXT,
        "metric" TEXT,
        "value" NUMERIC DEFAULT 0,
        "date" DATE,
        "notes" TEXT DEFAULT '',
        "category" TEXT DEFAULT 'general',
        "status" TEXT DEFAULT 'pending',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ performance table')

    await pool.query(`
      CREATE TABLE reports (
        id TEXT PRIMARY KEY,
        "type" TEXT,
        "title" TEXT,
        "aiInsights" TEXT,
        "metricList" JSONB DEFAULT '[]',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ reports table')

    await pool.query(`
      CREATE TABLE targets (
        id TEXT PRIMARY KEY,
        "memberId" TEXT REFERENCES users(id) ON DELETE CASCADE,
        "metric" TEXT,
        "targetValue" NUMERIC DEFAULT 0,
        "weekStart" DATE,
        "assignedBy" TEXT REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ targets table')

    await pool.query(`
      CREATE TABLE notifications (
        id TEXT PRIMARY KEY,
        "userIds" JSONB DEFAULT '[]',
        "title" TEXT,
        "message" TEXT,
        "type" TEXT DEFAULT 'info',
        "readBy" JSONB DEFAULT '[]',
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ notifications table')

    await pool.query(`
      CREATE TABLE projects (
        id TEXT PRIMARY KEY,
        "slug" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "team" TEXT,
        "createdBy" TEXT REFERENCES users(id),
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ projects table')

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id TEXT PRIMARY KEY,
        "createdAt" TIMESTAMP DEFAULT NOW(),
        "updatedAt" TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ settings table')

    // Seed default projects
    await pool.query(`
      INSERT INTO projects (id, slug, name, team, "createdBy", "createdAt", "updatedAt") VALUES
        ($1,$2,$3,$4,$5,$6,$6),
        ($7,$8,$9,$10,$11,$12,$12),
        ($13,$14,$15,$16,$17,$18,$18),
        ($19,$20,$21,$22,$23,$24,$24),
        ($25,$26,$27,$28,$29,$30,$30),
        ($31,$32,$33,$34,$35,$36,$36),
        ($37,$38,$39,$40,$41,$42,$42),
        ($43,$44,$45,$46,$47,$48,$48)
      ON CONFLICT (slug) DO NOTHING
    `, [
      'proj_1', 'monthly-events-spot-collection', 'Monthly Events Spot Collection', null, null, new Date().toISOString(),
      'proj_2', 'monthly-events-qa', 'Monthly Events QA', null, null, new Date().toISOString(),
      'proj_3', 'remote-team-process', 'Remote Team Process', null, null, new Date().toISOString(),
      'proj_4', 'bulk-upload', 'Bulk Upload', null, null, new Date().toISOString(),
      'proj_5', 'field-ops', 'Field Ops', null, null, new Date().toISOString(),
      'proj_6', 'rate-audit', 'Rate Audit', null, null, new Date().toISOString(),
      'proj_7', 'hpe', 'HPE', null, null, new Date().toISOString(),
      'proj_8', 'other', 'Other', null, null, new Date().toISOString(),
    ])
    console.log('✓ default projects seeded')

    console.log('\n✅ All tables recreated!')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
