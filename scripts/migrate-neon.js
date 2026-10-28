import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function main() {
  try {
    // Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        employeeId TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        role TEXT NOT NULL,
        team TEXT,
        passwordHash TEXT NOT NULL,
        createdAt TIMESTAMP DEFAULT NOW(),
        updatedAt TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ users table')

    // Profiles
    await pool.query(`
      CREATE TABLE IF NOT EXISTS profiles (
        id TEXT PRIMARY KEY,
        userId TEXT REFERENCES users(id) ON DELETE CASCADE,
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ profiles table')

    // Performance entries
    await pool.query(`
      CREATE TABLE IF NOT EXISTS performance (
        id TEXT PRIMARY KEY,
        userId TEXT REFERENCES users(id) ON DELETE CASCADE,
        team TEXT,
        metric TEXT,
        value NUMERIC DEFAULT 0,
        date DATE,
        notes TEXT DEFAULT '',
        category TEXT DEFAULT 'general',
        status TEXT DEFAULT 'pending',
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ performance table')

    // Reports
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reports (
        id TEXT PRIMARY KEY,
        type TEXT,
        title TEXT,
        aiInsights TEXT,
        metricList JSONB DEFAULT '[]',
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ reports table')

    // Targets
    await pool.query(`
      CREATE TABLE IF NOT EXISTS targets (
        id TEXT PRIMARY KEY,
        memberId TEXT REFERENCES users(id) ON DELETE CASCADE,
        metric TEXT,
        targetValue NUMERIC DEFAULT 0,
        weekStart DATE,
        assignedBy TEXT REFERENCES users(id),
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ targets table')

    // Notifications
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id TEXT PRIMARY KEY,
        userIds JSONB DEFAULT '[]',
        title TEXT,
        message TEXT,
        type TEXT DEFAULT 'info',
        readBy JSONB DEFAULT '[]',
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ notifications table')

    // Projects
    await pool.query(`
      CREATE TABLE IF NOT EXISTS projects (
        id TEXT PRIMARY KEY,
        slug TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        team TEXT,
        createdBy TEXT REFERENCES users(id),
        createdAt TIMESTAMP DEFAULT NOW()
      )
    `)
    console.log('✓ projects table')

    // Seed default projects
    await pool.query(`
      INSERT INTO projects (id, slug, name, team, createdBy, createdAt) VALUES
        ($1,$2,$3,$4,$5,$6),
        ($7,$8,$9,$10,$11,$12),
        ($13,$14,$15,$16,$17,$18),
        ($19,$20,$21,$22,$23,$24),
        ($25,$26,$27,$28,$29,$30),
        ($31,$32,$33,$34,$35,$36),
        ($37,$38,$39,$40,$41,$42),
        ($43,$44,$45,$46,$47,$48)
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

    console.log('\n✅ All tables created and seeded successfully!')
  } catch (err) {
    console.error('❌ Migration failed:', err.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

main()
