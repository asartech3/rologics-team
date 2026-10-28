// One-off: clear all test performance entries + reports, keep users/profiles/settings
const fs = require('fs')
const path = require('path')

const DATA = path.join(process.cwd(), 'db', 'data.json')
const BACKUP = path.join(process.cwd(), 'db', 'data.backup-' + Date.now() + '.json')

const before = fs.readFileSync(DATA, 'utf8')
fs.writeFileSync(BACKUP, before)

const data = JSON.parse(before)
const perfCount = (data.performance || []).length
const repCount = (data.reports || []).length
data.performance = []
data.reports = []
fs.writeFileSync(DATA, JSON.stringify(data, null, 2))

console.log(`Removed ${perfCount} performance entries and ${repCount} reports.`)
console.log(`Users: ${data.users.length}, Profiles: ${data.profiles.length} (kept)`)
console.log(`Backup saved to: ${path.basename(BACKUP)}`)
