import fs from 'fs'
import path from 'path'

const DB_PATH = path.join(process.cwd(), 'db', 'data.json')

function ensureDb() {
  const dir = path.dirname(DB_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({
      users: [],
      profiles: [],
      performance: [],
      reports: [],
      settings: {},
    }, null, 2))
  }
}

function read() {
  ensureDb()
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf8'))
}

function write(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2))
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

// ---------- USERS ----------
export function getUsers() {
  return read().users
}

export function getUserById(id) {
  return read().users.find((u) => u.id === id)
}

export function getUserByEmployeeId(employeeId) {
  return read().users.find((u) => u.employeeId === employeeId)
}

export function createUser(user) {
  const data = read()
  const newUser = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...user,
  }
  data.users.push(newUser)
  write(data)
  return newUser
}

export function updateUser(id, updates) {
  const data = read()
  const idx = data.users.findIndex((u) => u.id === id)
  if (idx === -1) return null
  data.users[idx] = { ...data.users[idx], ...updates, updatedAt: new Date().toISOString() }
  write(data)
  return data.users[idx]
}

export function deleteUser(id) {
  const data = read()
  const before = data.users.length
  data.users = data.users.filter((u) => u.id !== id)
  write(data)
  return data.users.length < before
}

export function deleteProfile(id) {
  const data = read()
  const before = data.profiles.length
  data.profiles = data.profiles.filter((p) => p.id !== id)
  write(data)
  return data.profiles.length < before
}

// ---------- PROFILES ----------
export function getProfiles() {
  return read().profiles
}

export function getProfileByUserId(userId) {
  return read().profiles.find((p) => p.userId === userId)
}

export function getProfileByEmployeeId(employeeId) {
  const user = getUserByEmployeeId(employeeId)
  if (!user) return null
  return read().profiles.find((p) => p.userId === user.id)
}

export function createProfile(profile) {
  const data = read()
  const newProfile = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...profile,
  }
  data.profiles.push(newProfile)
  write(data)
  return newProfile
}

export function updateProfile(id, updates) {
  const data = read()
  const idx = data.profiles.findIndex((p) => p.id === id)
  if (idx === -1) return null
  data.profiles[idx] = { ...data.profiles[idx], ...updates, updatedAt: new Date().toISOString() }
  write(data)
  return data.profiles[idx]
}

// ---------- PERFORMANCE ----------
export function getPerformance() {
  return read().performance
}

export function getPerformanceById(id) {
  return read().performance.find((e) => e.id === id)
}

export function createPerformanceEntry(entry) {
  const data = read()
  const newEntry = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...entry,
  }
  data.performance.push(newEntry)
  write(data)
  return newEntry
}

export function updatePerformanceEntry(id, updates) {
  const data = read()
  const idx = data.performance.findIndex((e) => e.id === id)
  if (idx === -1) return null
  data.performance[idx] = { ...data.performance[idx], ...updates, updatedAt: new Date().toISOString() }
  write(data)
  return data.performance[idx]
}

export function deletePerformanceEntry(id) {
  const data = read()
  const before = data.performance.length
  data.performance = data.performance.filter((e) => e.id !== id)
  write(data)
  return data.performance.length < before
}

// ---------- REPORTS ----------
export function getReports() {
  return read().reports
}

export function createReport(report) {
  const data = read()
  const newReport = {
    id: genId(),
    createdAt: new Date().toISOString(),
    ...report,
  }
  data.reports.push(newReport)
  write(data)
  return newReport
}

export function updateReport(id, updates) {
  const data = read()
  const idx = data.reports.findIndex((r) => r.id === id)
  if (idx === -1) return null
  data.reports[idx] = { ...data.reports[idx], ...updates, updatedAt: new Date().toISOString() }
  write(data)
  return data.reports[idx]
}

export function deleteReport(id) {
  const data = read()
  const before = data.reports.length
  data.reports = data.reports.filter((r) => r.id !== id)
  write(data)
  return data.reports.length < before
}

// ---------- PROJECTS ----------
// Canonical project list. Seeded on first read; Team Leads / Manager / CEO can add more.
const PROJECT_SEED = [
  'Monthly Events Spot Collection',
  'Monthly Events QA',
  'Remote Team Process',
  'Bulk Upload',
  'Field Ops',
  'Rate Audit',
  'HPE',
  'Other',
]

export function slugify(name) {
  return (name || '')
    .trim()
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function getProjects() {
  const data = read()
  if (!data.projects) {
    data.projects = PROJECT_SEED.map((name) => ({
      id: genId(),
      slug: slugify(name),
      name,
      team: null, // null = available to all teams
      createdBy: null,
      createdAt: new Date().toISOString(),
    }))
    write(data)
  }
  return data.projects
}

export function createProject({ name, team, createdBy }) {
  const data = read()
  if (!data.projects) data.projects = []
  const project = {
    id: genId(),
    slug: slugify(name),
    name: String(name).trim(),
    team: team || null, // null = all teams
    createdBy: createdBy || null,
    createdAt: new Date().toISOString(),
  }
  data.projects.push(project)
  write(data)
  return project
}

export function deleteProject(id) {
  const data = read()
  if (!data.projects) return false
  const before = data.projects.length
  data.projects = data.projects.filter((p) => p.id !== id)
  write(data)
  return data.projects.length < before
}

// ---------- TARGETS ----------
function normalize(data) {
  if (!data.targets) data.targets = []
  if (!data.notifications) data.notifications = []
  return data
}

export function getTargets() {
  return normalize(read()).targets
}

export function getTargetMember(memberId, weekStart) {
  return normalize(read()).targets.find((t) => t.memberId === memberId && (t.weekStart || '') === (weekStart || '')) || null
}

export function setTarget({ memberId, metric, targetValue, weekStart, assignedBy }) {
  const data = normalize(read())
  let t = data.targets.find((x) => x.memberId === memberId && (x.weekStart || '') === (weekStart || ''))
  if (t) {
    t.metric = metric
    t.targetValue = targetValue
    t.assignedBy = assignedBy
    t.updatedAt = new Date().toISOString()
  } else {
    t = {
      id: genId(),
      memberId,
      metric,
      targetValue,
      weekStart,
      assignedBy,
      createdAt: new Date().toISOString(),
    }
    data.targets.push(t)
  }
  write(data)
  return t
}

// ---------- NOTIFICATIONS ----------
export function getNotifications() {
  return normalize(read()).notifications
}

export function createNotification({ userIds, title, message, type }) {
  const data = normalize(read())
  const n = {
    id: genId(),
    userIds,        // array of user ids who should see it
    title,
    message,
    type: type || 'info',
    readBy: [],     // user ids who marked it read
    createdAt: new Date().toISOString(),
  }
  data.notifications.push(n)
  // keep the file small
  if (data.notifications.length > 500) data.notifications = data.notifications.slice(-500)
  write(data)
  return n
}

export function markNotificationsRead(userId, ids) {
  const data = normalize(read())
  data.notifications.forEach((n) => {
    if (n.userIds.includes(userId) && (!ids || ids.includes(n.id)) && !n.readBy.includes(userId)) {
      n.readBy.push(userId)
    }
  })
  write(data)
  return data.notifications.filter((n) => n.userIds.includes(userId))
}

// ---------- SETTINGS ----------
export function getSettings() {
  return read().settings
}

export function setSettings(settings) {
  const data = read()
  data.settings = { ...data.settings, ...settings }
  write(data)
  return data.settings
}
