import { Pool } from 'pg'

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// ---------- HELPER ----------
async function q(text, params = []) {
  const res = await pool.query(text, params)
  return res.rows
}

// ---------- USERS ----------
export async function getUsers() {
  return q('SELECT * FROM users ORDER BY "createdAt" DESC')
}

export async function getUserById(id) {
  const rows = await q('SELECT * FROM users WHERE id = $1', [id])
  return rows[0] || null
}

export async function getUserByEmployeeId(employeeId) {
  const rows = await q('SELECT * FROM users WHERE "employeeId" = $1', [employeeId])
  return rows[0] || null
}

export async function createUser(user) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const now = new Date().toISOString()
  await q(
    `INSERT INTO users (id, "employeeId", "name", "role", "team", "passwordHash", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    [id, user.employeeId, user.name, user.role, user.team || null, user.passwordHash, now, now]
  )
  return { id, ...user, createdAt: now }
}

export async function updateUser(id, updates) {
  const now = new Date().toISOString()
  const rows = await q(
    `UPDATE users SET "name" = COALESCE($2, "name"), "role" = COALESCE($3, "role"),
     "team" = COALESCE($4, "team"), "passwordHash" = COALESCE($5, "passwordHash"), "updatedAt" = $6
     WHERE id = $1 RETURNING *`,
    [id, updates.name, updates.role, updates.team, updates.passwordHash, now]
  )
  return rows[0] || null
}

export async function deleteUser(id) {
  const rows = await q('DELETE FROM users WHERE id = $1 RETURNING id', [id])
  return rows.length > 0
}

export async function deleteProfile(id) {
  const rows = await q('DELETE FROM profiles WHERE id = $1 RETURNING id', [id])
  return rows.length > 0
}

// ---------- PROFILES ----------
export async function getProfiles() {
  return q('SELECT * FROM profiles')
}

export async function getProfileByUserId(userId) {
  const rows = await q('SELECT * FROM profiles WHERE "userId" = $1', [userId])
  return rows[0] || null
}

export async function getProfileByEmployeeId(employeeId) {
  const rows = await q(
    `SELECT p.* FROM profiles p
     JOIN users u ON p."userId" = u.id
     WHERE u."employeeId" = $1`,
    [employeeId]
  )
  return rows[0] || null
}

export async function createProfile(profile) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const now = new Date().toISOString()
  await q(
    `INSERT INTO profiles (id, "userId", "createdAt") VALUES ($1,$2,$3)`,
    [id, profile.userId, now]
  )
  return { id, ...profile, createdAt: now }
}

export async function updateProfile(id, updates) {
  const now = new Date().toISOString()
  const rows = await q(
    `UPDATE profiles SET "updatedAt" = $2 WHERE id = $1 RETURNING *`,
    [id, now]
  )
  return rows[0] || null
}

// ---------- PERFORMANCE ----------
export async function getPerformance() {
  return q('SELECT * FROM performance ORDER BY "createdAt" DESC')
}

export async function getPerformanceById(id) {
  const rows = await q('SELECT * FROM performance WHERE id = $1', [id])
  return rows[0] || null
}

export async function createPerformanceEntry(entry) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const now = new Date().toISOString()
  const rows = await q(
    `INSERT INTO performance (id, "userId", "team", "metric", "value", "date", "notes", "category", "status", "workDescription", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING *`,
    [id, entry.userId, entry.team || null, entry.metric, entry.value || 0, entry.date || new Date().toISOString().slice(0, 10),
     entry.notes || '', entry.category || 'general', entry.status || 'pending', entry.workDescription || '', now]
  )
  return rows[0]
}

export async function updatePerformanceEntry(id, updates) {
  const rows = await q(
    `UPDATE performance SET "status" = COALESCE($2, "status"), "value" = COALESCE($3, "value"),
     "notes" = COALESCE($4, "notes"), "updatedAt" = NOW()
     WHERE id = $1 RETURNING *`,
    [id, updates.status, updates.value, updates.notes]
  )
  return rows[0] || null
}

export async function deletePerformanceEntry(id) {
  const rows = await q('DELETE FROM performance WHERE id = $1 RETURNING id', [id])
  return rows.length > 0
}

// ---------- REPORTS ----------
export async function getReports() {
  return q('SELECT * FROM reports ORDER BY "createdAt" DESC')
}

export async function createReport(report) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const now = new Date().toISOString()
  await q(
    `INSERT INTO reports (id, "type", "title", "aiInsights", "metricList", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, report.type, report.title, report.aiInsights, JSON.stringify(report.metricList || []), now]
  )
  return { id, ...report, createdAt: now }
}

export async function updateReport(id, updates) {
  const rows = await q(`UPDATE reports SET "title" = COALESCE($2, "title") WHERE id = $1 RETURNING *`, [id, updates.title])
  return rows[0] || null
}

export async function deleteReport(id) {
  const rows = await q('DELETE FROM reports WHERE id = $1 RETURNING id', [id])
  return rows.length > 0
}

// ---------- TARGETS ----------
export async function getTargets() {
  return q('SELECT * FROM targets ORDER BY "createdAt" DESC')
}

export async function getTargetMember(memberId, weekStart) {
  const rows = await q('SELECT * FROM targets WHERE "memberId" = $1 AND "weekStart" = $2', [memberId, weekStart])
  return rows[0] || null
}

export async function setTarget({ memberId, metric, targetValue, weekStart, assignedBy }) {
  const now = new Date().toISOString()
  const existing = await getTargetMember(memberId, weekStart)
  if (existing) {
    const rows = await q(
      `UPDATE targets SET "metric" = $2, "targetValue" = $3, "assignedBy" = $4, "updatedAt" = $5 WHERE id = $1 RETURNING *`,
      [existing.id, metric, targetValue, assignedBy, now]
    )
    return { ...existing, metric, targetValue, assignedBy, updatedAt: now }
  }
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  await q(
    `INSERT INTO targets (id, "memberId", "metric", "targetValue", "weekStart", "assignedBy", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, memberId, metric, targetValue, weekStart, assignedBy, now]
  )
  return { id, memberId, metric, targetValue, weekStart, assignedBy, createdAt: now }
}

// ---------- NOTIFICATIONS ----------
export async function getNotifications() {
  return q('SELECT * FROM notifications ORDER BY "createdAt" DESC')
}

export async function createNotification({ userIds, title, message, type }) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const now = new Date().toISOString()
  await q(
    `INSERT INTO notifications (id, "userIds", "title", "message", "type", "readBy", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6,$7)`,
    [id, JSON.stringify(userIds || []), title, message, type || 'info', JSON.stringify([]), now]
  )
  return { id, userIds: userIds || [], title, message, type, readBy: [], createdAt: now }
}

export async function markNotificationsRead(userId, ids) {
  const rows = await q('SELECT * FROM notifications')
  for (const n of rows) {
    const userIdsArr = typeof n.userIds === 'string' ? JSON.parse(n.userIds) : n.userIds
    const readByArr = typeof n.readBy === 'string' ? JSON.parse(n.readBy) : n.readBy
    if (userIdsArr.includes(userId) && (!ids || ids.includes(n.id)) && !readByArr.includes(userId)) {
      const newReadBy = [...readByArr, userId]
      await q(`UPDATE notifications SET "readBy" = $2 WHERE id = $1`, [n.id, JSON.stringify(newReadBy)])
    }
  }
  return q('SELECT * FROM notifications WHERE "userIds" @> $1::jsonb', [JSON.stringify([userId])])
}

// ---------- SETTINGS ----------
export async function getSettings() {
  const rows = await q('SELECT * FROM settings LIMIT 1')
  return rows[0] || {}
}

export async function setSettings(settings) {
  const existing = await getSettings()
  if (existing.id) {
    await q(`UPDATE settings SET "updatedAt" = NOW() WHERE id = $1`, [existing.id])
    return { ...existing, ...settings }
  }
  const id = Date.now().toString(36)
  await q(`INSERT INTO settings (id, "createdAt") VALUES ($1, NOW())`, [id])
  return { id, ...settings }
}

// ---------- PROJECTS ----------
export function slugify(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export async function getProjects() {
  return q('SELECT * FROM projects ORDER BY "name"')
}

export async function createProject({ name, team, createdBy }) {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
  const slug = slugify(name)
  const now = new Date().toISOString()
  await q(
    `INSERT INTO projects (id, slug, name, team, "createdBy", "createdAt")
     VALUES ($1,$2,$3,$4,$5,$6)`,
    [id, slug, name.trim(), team || null, createdBy || null, now]
  )
  return { id, slug, name: name.trim(), team, createdBy, createdAt: now }
}

export async function deleteProject(id) {
  const rows = await q('DELETE FROM projects WHERE id = $1 RETURNING id', [id])
  return rows.length > 0
}
